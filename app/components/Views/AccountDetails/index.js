import React, { Component } from 'react';
import PropTypes from 'prop-types';
import {
	ActivityIndicator,
	StyleSheet,
	View,
	Clipboard,
	InteractionManager,
	TextInput,
	ScrollView
} from 'react-native';
import Share from 'react-native-share'; // eslint-disable-line  import/default
import { colors, fontStyles } from '../../../styles/common';
import { connect } from 'react-redux';
import { strings } from '../../../../locales/i18n';
import Identicon from '../../UI/Identicon';
import MaterialIcon from 'react-native-vector-icons/MaterialIcons';
import StyledButton from '../../UI/StyledButton';
import Engine from '../../../core/Engine';
import Logger from '../../../util/Logger';
import { hasBlockExplorer } from '../../../util/networks';
import { getNavigationOptionsTitle } from '../../UI/Navbar';
import { getEtherscanAddressUrl } from '../../../util/etherscan';
import { renderAccountName } from '../../../util/address';
import { showAlert } from '../../../actions/alert';

const styles = StyleSheet.create({
	wrapper: {
		backgroundColor: colors.white,
		flex: 1
	},
	accountWrapper: {
		justifyContent: 'center',
		alignItems: 'center',
		marginTop: 20,
		borderBottomWidth: 2,
		borderBottomColor: colors.concrete
	},
	identiconWrapper: {
		flex: 1
	},
	accountLabelWrapper: {
		marginTop: 10,
		flex: 1,
		flexDirection: 'row'
	},
	labelText: {
		height: 50,
		fontSize: 28,
		textAlign: 'center',
		color: colors.black,
		...fontStyles.normal
	},
	labelActionIcons: {
		alignItems: 'center'
	},
	iconEdit: {
		padding: 10,
		color: colors.gray
	},
	actionsWrapper: {
		marginLeft: 50,
		marginRight: 50
	},
	button: {
		marginBottom: 10
	},
	loader: {
		backgroundColor: colors.white,
		flex: 1,
		minHeight: 300,
		justifyContent: 'center',
		alignItems: 'center'
	}
});

/**
 * View that contains details about the selected Address
 */
class AccountDetails extends Component {
	static navigationOptions = ({ navigation }) =>
		getNavigationOptionsTitle(strings('account_details.title'), navigation);

	state = {
		ready: false,
		accountLabelEditable: false,
		accountLabel: '',
		originalAccountLabel: ''
	};

	static propTypes = {
		/**
		 * String that represents the selected address
		 */
		selectedAddress: PropTypes.string,
		/**
		/* navigation object required to push new views
		*/
		navigation: PropTypes.object,
		/**
		/* Identities object required to get account name
		*/
		identities: PropTypes.object,
		/**
		 * Object representing the selected network
		 */
		network: PropTypes.object.isRequired,
		/**
		 * Action that shows the global alert
		 */
		showAlert: PropTypes.func.isRequired
	};

	componentDidMount = () => {
		const { identities, selectedAddress } = this.props;
		const accountLabel = renderAccountName(selectedAddress, identities);
		this.setState({ accountLabel });
		InteractionManager.runAfterInteractions(() => {
			this.setState({ ready: true });
		});
	};

	copyAccountToClipboard = async () => {
		const { selectedAddress } = this.props;
		await Clipboard.setString(selectedAddress);
		this.props.showAlert({
			isVisible: true,
			autodismiss: 1500,
			content: 'clipboard-alert',
			data: { msg: strings('account_details.account_copied_to_clipboard') }
		});
	};

	goToEtherscan = () => {
		const { selectedAddress, network } = this.props;
		const url = getEtherscanAddressUrl(network.provider.type, selectedAddress);
		this.props.navigation.pop();
		InteractionManager.runAfterInteractions(() => {
			this.props.navigation.push('Webview', {
				url,
				title: 'etherscan.io'
			});
		});
	};

	goToRevealPrivateKey = () => {
		this.props.navigation.navigate('RevealPrivateCredentialView', { privateCredentialName: 'private_key' });
	};

	onShare = () => {
		const { selectedAddress } = this.props;
		Share.open({
			message: `ethereum:${selectedAddress}`
		}).catch(err => {
			Logger.log('Error while trying to share address', err);
		});
	};

	setAccountLabel = () => {
		const { PreferencesController } = Engine.context;
		const { selectedAddress } = this.props;
		const { accountLabel } = this.state;
		PreferencesController.setAccountLabel(selectedAddress, accountLabel);
		this.setState({ accountLabelEditable: false });
	};

	onAccountLabelChange = accountLabel => {
		this.setState({ accountLabel });
	};

	setAccountLabelEditable = () => {
		this.setState({ accountLabelEditable: true });
	};

	cancelAccountLabelEdition = () => {
		const { identities, selectedAddress } = this.props;
		const accountLabel = renderAccountName(selectedAddress, identities);
		this.setState({ accountLabelEditable: false, accountLabel });
	};

	renderContent = () => {
		const { selectedAddress, network } = this.props;
		const { accountLabelEditable, accountLabel } = this.state;

		return (
			<ScrollView style={styles.wrapper} testID={'account-details-screen'}>
				<View style={styles.accountWrapper}>
					<View styles={styles.identiconWrapper}>
						<Identicon address={selectedAddress} />
					</View>
					<View style={styles.accountLabelWrapper}>
						<TextInput
							style={styles.labelText}
							editable={accountLabelEditable}
							onChangeText={this.onAccountLabelChange}
							onSubmitEditing={this.setAccountLabel}
							onBlur={this.cancelAccountLabelEdition}
							testID={'account-label-text-input'}
							value={accountLabel}
						/>
						<View style={styles.labelActionIcons}>
							{accountLabelEditable ? null : (
								<MaterialIcon
									name="edit"
									style={styles.iconEdit}
									size={22}
									onPress={this.setAccountLabelEditable}
									testID={'edit-account-label-icon'}
								/>
							)}
						</View>
					</View>
				</View>

				<View style={styles.actionsWrapper}>
					<StyledButton
						containerStyle={styles.button}
						type={'normal'}
						onPress={this.onShare}
						testID={'share-account-button'}
					>
						{strings('account_details.share_account')}
					</StyledButton>
					{hasBlockExplorer(network.provider.type) && (
						<StyledButton
							containerStyle={styles.button}
							type={'normal'}
							onPress={this.goToEtherscan}
							testID={'view-account-button'}
						>
							{strings('account_details.view_account')}
						</StyledButton>
					)}
					<StyledButton
						containerStyle={styles.button}
						type={'warning'}
						onPress={this.goToRevealPrivateKey}
						testID={'show-private-key-button'}
					>
						{strings('account_details.show_private_key')}
					</StyledButton>
				</View>
			</ScrollView>
		);
	};

	renderLoader = () => (
		<View style={styles.loader}>
			<ActivityIndicator size="small" />
		</View>
	);

	render = () => {
		const { ready } = this.state;
		return ready ? this.renderContent() : this.renderLoader();
	};
}

const mapStateToProps = state => ({
	network: state.engine.backgroundState.NetworkController,
	selectedAddress: state.engine.backgroundState.PreferencesController.selectedAddress,
	identities: state.engine.backgroundState.PreferencesController.identities
});

const mapDispatchToProps = dispatch => ({
	showAlert: config => dispatch(showAlert(config))
});

export default connect(
	mapStateToProps,
	mapDispatchToProps
)(AccountDetails);