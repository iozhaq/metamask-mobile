import {
	AccountTrackerController,
	AddressBookController,
	AssetsContractController,
	AssetsController,
	AssetsDetectionController,
	ComposableController,
	CurrencyRateController,
	KeyringController,
	PersonalMessageManager,
	NetworkController,
	NetworkStatusController,
	PhishingController,
	PreferencesController,
	ShapeShiftController,
	TokenBalancesController,
	TokenRatesController,
	TransactionController
} from 'gaba';

import Encryptor from './Encryptor';
import { toChecksumAddress } from 'ethereumjs-util';
import Networks from '../util/networks';

const encryptor = new Encryptor();
const TX_CHECK_MAX_FREQUENCY = 5000;

/**
 * Core controller responsible for composing other GABA controllers together
 * and exposing convenience methods for common wallet operations.
 */
class Engine {
	/**
	 * ComposableController reference containing all child controllers
	 */
	datamodel;

	/**
	 * Object containing the info for the latest incoming tx block
	 * for each address and network
	 */
	lastIncomingTxBlockInfo;

	/**
	 * Creates a CoreController instance
	 */
	constructor(initialState = {}) {
		if (!Engine.instance) {
			this.datamodel = new ComposableController(
				[
					new KeyringController({ encryptor }, initialState.KeyringController),
					new AccountTrackerController(),
					new AddressBookController(),
					new AssetsContractController(),
					new AssetsController(),
					new AssetsDetectionController(),
					new CurrencyRateController(),
					new PersonalMessageManager(),
					new NetworkController(
						{
							providerConfig: {
								static: {
									eth_sendTransaction: async (payload, next, end) => {
										const { TransactionController } = this.datamodel.context;
										try {
											const hash = await (await TransactionController.addTransaction(
												payload.params[0]
											)).result;
											end(undefined, hash);
										} catch (error) {
											end(error);
										}
									},
									eth_sign: async (payload, next, end) => {
										const { PersonalMessageManager } = this.datamodel.context;
										try {
											const rawSig = await PersonalMessageManager.addUnapprovedMessageAsync({
												data: payload.params[1],
												from: payload.params[0]
											});
											end(undefined, rawSig);
										} catch (error) {
											end(error);
										}
									},
									personal_sign: async (payload, next, end) => {
										const { PersonalMessageManager } = this.datamodel.context;
										try {
											const rawSig = await PersonalMessageManager.addUnapprovedMessageAsync({
												data: payload.params[0],
												from: payload.params[1]
											});
											end(undefined, rawSig);
										} catch (error) {
											end(error);
										}
									}
								},
								getAccounts: end => {
									const { KeyringController } = this.datamodel.context;
									const isUnlocked = KeyringController.keyring.memStore.getState().isUnlocked;
									const selectedAddress = this.datamodel.context.PreferencesController.state
										.selectedAddress;
									end(null, isUnlocked && selectedAddress ? [selectedAddress] : []);
								}
							}
						},
						{ network: '3', provider: { type: 'ropsten' } }
					),
					new NetworkStatusController(),
					new PhishingController(),
					new PreferencesController(),
					new ShapeShiftController(),
					new TokenBalancesController(),
					new TokenRatesController(),
					new TransactionController()
				],
				initialState
			);

			const {
				KeyringController: keyring,
				NetworkController: network,
				TransactionController: transaction
			} = this.datamodel.context;

			network.refreshNetwork();
			transaction.configure({ sign: keyring.signTransaction.bind(keyring) });
			network.subscribe(this.refreshNetwork);
			this.refreshNetwork();
			Engine.instance = this;
		}
		return Engine.instance;
	}

	/**
	 * Refreshes all controllers that depend on the network
	 */
	refreshNetwork = () => {
		const {
			AccountTrackerController,
			AssetsContractController,
			NetworkController: { provider },
			TransactionController
		} = this.datamodel.context;

		provider.sendAsync = provider.sendAsync.bind(provider);
		AssetsContractController.configure({ provider });
		AccountTrackerController.configure({ provider });
		TransactionController.configure({ provider });
	};

	refreshTransactionHistory = async forceCheck => {
		const { TransactionController, PreferencesController, NetworkController } = this.datamodel.context;
		const { selectedAddress } = PreferencesController.state;
		const { type: networkType } = NetworkController.state.provider;
		const { networkId } = Networks[networkType];
		try {
			const allLastIncomingTxBlocks = this.lastIncomingTxBlockInfo || {};
			let blockNumber = null;
			if (allLastIncomingTxBlocks[selectedAddress] && allLastIncomingTxBlocks[selectedAddress][`${networkId}`]) {
				blockNumber = allLastIncomingTxBlocks[selectedAddress][`${networkId}`].blockNumber;
				// Let's make sure we're not doing this too often...
				const timeSinceLastCheck = allLastIncomingTxBlocks[selectedAddress][`${networkId}`].lastCheck;
				const delta = Date.now() - timeSinceLastCheck;
				if (delta < TX_CHECK_MAX_FREQUENCY && !forceCheck) {
					return false;
				}
			} else {
				allLastIncomingTxBlocks[selectedAddress] = {};
			}
			//Fetch txs and get the new lastIncomingTxBlock number
			const newlastIncomingTxBlock = await TransactionController.fetchAll(selectedAddress, blockNumber);
			// Store it so next time we ask for the newer txs only
			if (newlastIncomingTxBlock && newlastIncomingTxBlock !== blockNumber) {
				allLastIncomingTxBlocks[selectedAddress][`${networkId}`] = {
					block: newlastIncomingTxBlock,
					lastCheck: Date.now()
				};
				this.lastIncomingTxBlockInfo = allLastIncomingTxBlocks;
			}
		} catch (e) {
			console.log('Error while fetching all txs', e); // eslint-disable-line
		}
	};

	sync = async ({ accounts, preferences, network, transactions, seed, pass }) => {
		const {
			KeyringController,
			PreferencesController,
			NetworkController,
			TransactionController
		} = this.datamodel.context;

		// Recreate accounts
		await KeyringController.createNewVaultAndRestore(pass, seed);
		for (let i = 0; i < accounts.hd.length - 1; i++) {
			await KeyringController.addNewAccount();
		}

		// Restore preferences
		const updatedPref = { ...preferences, identities: {} };
		Object.keys(preferences.identities).forEach(address => {
			const checksummedAddress = toChecksumAddress(address);
			if (accounts.hd.includes(checksummedAddress)) {
				updatedPref.identities[checksummedAddress] = preferences.identities[address];
			}
		});
		await PreferencesController.update(updatedPref);
		await PreferencesController.update({ selectedAddress: toChecksumAddress(updatedPref.selectedAddress) });

		TransactionController.update({
			transactions: transactions.map(tx => ({
				id: tx.id,
				networkID: tx.metamaskNetworkId,
				origin: tx.origin,
				status: tx.status,
				time: tx.time,
				transactionHash: tx.hash,
				rawTx: tx.rawTx,
				transaction: {
					from: tx.txParams.from,
					to: tx.txParams.to,
					nonce: tx.txParams.nonce,
					gas: tx.txParams.gas,
					gasPrice: tx.txParams.gasPrice,
					value: tx.txParams.value
				}
			}))
		});

		// Select same network ?
		NetworkController.setProviderType(network.provider.type);
	};
}

let instance;

export default {
	get context() {
		return instance && instance.datamodel && instance.datamodel.context;
	},
	get state() {
		const {
			AccountTrackerController,
			AssetsContractController,
			AssetsController,
			AssetsDetectionController,
			CurrencyRateController,
			KeyringController,
			PersonalMessageManager,
			NetworkController,
			NetworkStatusController,
			PreferencesController,
			TokenBalancesController,
			TokenRatesController,
			TransactionController
		} = instance.datamodel.state;

		return {
			AccountTrackerController,
			AssetsContractController,
			AssetsController,
			AssetsDetectionController,
			CurrencyRateController,
			KeyringController,
			PersonalMessageManager,
			NetworkController,
			NetworkStatusController,
			PreferencesController,
			TokenBalancesController,
			TokenRatesController,
			TransactionController
		};
	},
	get datamodel() {
		return instance.datamodel;
	},
	sync(data) {
		return instance.sync(data);
	},
	refreshTransactionHistory(forceCheck = false) {
		return instance.refreshTransactionHistory(forceCheck);
	},
	init(state) {
		instance = new Engine(state);
		Object.freeze(instance);
		return instance;
	}
};