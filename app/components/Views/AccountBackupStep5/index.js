import React, { Component } from 'react';
import { ScrollView, Alert, Text, TouchableOpacity, View, SafeAreaView, StyleSheet } from 'react-native';
import PropTypes from 'prop-types';
import Pager from '../../UI/Pager';
import { colors, fontStyles } from '../../../styles/common';
import StyledButton from '../../UI/StyledButton';
import { strings } from '../../../../locales/i18n';
import { connect } from 'react-redux';
import { seedphraseBackedUp } from '../../../actions/user';

const styles = StyleSheet.create({
	mainWrapper: {
		backgroundColor: colors.white,
		flex: 1
	},
	wrapper: {
		flex: 1,
		padding: 30,
		paddingTop: 0
	},
	content: {
		alignItems: 'flex-start'
	},
	title: {
		fontSize: 32,
		marginTop: 20,
		marginBottom: 20,
		color: colors.fontPrimary,
		justifyContent: 'center',
		textAlign: 'left',
		...fontStyles.normal
	},
	text: {
		marginBottom: 10,
		justifyContent: 'center'
	},
	label: {
		fontSize: 16,
		lineHeight: 23,
		color: colors.fontPrimary,
		textAlign: 'left',
		...fontStyles.normal
	},
	buttonWrapper: {
		marginTop: 30,
		flex: 1,
		justifyContent: 'flex-end'
	},
	navbarLeftButton: {
		alignSelf: 'flex-start',
		paddingHorizontal: 22,
		paddingTop: 20,
		paddingBottom: 10
	},
	navbarLeftText: {
		fontSize: 18,
		color: colors.primary,
		...fontStyles.normal
	},
	seedPhraseWrapper: {
		backgroundColor: colors.lighterGray,
		borderRadius: 10,
		marginBottom: 22,
		flexDirection: 'row',
		borderColor: colors.borderColor,
		borderWidth: 1
	},
	colLeft: {
		paddingVertical: 20,
		flex: 1,
		alignItems: 'center',
		borderColor: colors.borderColor,
		borderRightWidth: 1
	},
	colRight: {
		paddingVertical: 20,
		flex: 1,
		alignItems: 'center'
	},
	word: {
		paddingHorizontal: 8,
		paddingTop: 6,
		paddingBottom: 4,
		width: 105,
		fontSize: 14,
		lineHeight: 14,
		color: colors.fontPrimary,
		backgroundColor: colors.white,
		borderColor: colors.borderColor,
		borderWidth: 1,
		marginBottom: 15,
		borderRadius: 4
	},
	selectableWord: {
		borderColor: colors.primary,
		borderWidth: 1,
		paddingHorizontal: 8,
		paddingVertical: 5,
		width: 95,
		fontSize: 14,
		color: colors.fontPrimary,
		lineHeight: 14,
		backgroundColor: colors.white,
		marginBottom: 6,
		borderRadius: 4
	},
	selectableWordText: {
		textAlign: 'center',
		fontSize: 14,
		lineHeight: 14
	},
	words: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		justifyContent: 'space-between'
	},
	selectedWord: {
		backgroundColor: colors.another50ShadesOfGrey,
		borderWidth: 1,
		borderColor: colors.another50ShadesOfGrey
	},
	selectedWordText: {
		color: colors.white
	},
	currentWord: {
		borderWidth: 1,
		borderColor: colors.primary
	}
});

/**
 * View that's shown during the fifth step of
 * the backup seed phrase flow
 */
class AccountBackupStep5 extends Component {
	static propTypes = {
		/**
		/* navigation object required to push and pop other views
		*/
		navigation: PropTypes.object,
		/**
		 * The action to update the seedphrase backed up flag
		 * in the redux store
		 */
		seedphraseBackedUp: PropTypes.func
	};

	constructor(props) {
		super(props);
		const words = props.navigation.getParam('words', []);
		if (process.env.JEST_WORKER_ID === undefined) {
			this.words = [...words].sort(() => 0.5 - Math.random());
		} else {
			this.words = words;
		}
	}

	state = {
		confirmedWords: Array(12).fill(),
		currentIndex: 0
	};

	goBack = () => {
		this.props.navigation.goBack();
	};

	goNext = () => {
		const words = this.props.navigation.getParam('words', []);
		if (words.join('') === this.state.confirmedWords.join('')) {
			this.props.seedphraseBackedUp();
			this.props.navigation.navigate('AccountBackupStep6');
		} else {
			Alert.alert(strings('account_backup_step_5.error_title'), strings('account_backup_step_5.error_message'));
		}
	};

	selectWord = (word, i) => {
		const newConfirmedWords = this.state.confirmedWords.slice();
		let newIndex;
		if (newConfirmedWords.includes(word)) {
			const matchIndex = newConfirmedWords.indexOf(word);
			newConfirmedWords[matchIndex] = undefined;
			newIndex = matchIndex;
		} else {
			// Find next empty cell
			newConfirmedWords[this.state.currentIndex] = word;
			newIndex = 11;
			for (i = this.state.currentIndex; i < 12; i++) {
				if (newConfirmedWords[i] === undefined) {
					newIndex = i;
					break;
				}
			}
		}
		this.setState({ confirmedWords: newConfirmedWords, currentIndex: newIndex });
	};

	updateWordAtIndex = index => {
		const newConfirmedWords = this.state.confirmedWords.slice();
		const newIndex = index;
		newConfirmedWords[index] = undefined;
		this.setState({ confirmedWords: newConfirmedWords, currentIndex: newIndex });
	};

	render() {
		return (
			<SafeAreaView style={styles.mainWrapper}>
				<ScrollView style={styles.mainWrapper} testID={'account-backup-step-5-screen'}>
					<Pager pages={5} selected={4} />
					<TouchableOpacity onPress={this.goBack} style={styles.navbarLeftButton}>
						<Text style={styles.navbarLeftText}>{strings('account_backup_step_5.back')}</Text>
					</TouchableOpacity>
					<View style={styles.wrapper} testID={'protect-your-account-screen'}>
						<View style={styles.content}>
							<Text style={styles.title}>{strings('account_backup_step_5.title')}</Text>
							<View style={styles.text}>
								<Text style={styles.label}>{strings('account_backup_step_5.info_text')}</Text>
							</View>

							<View style={styles.seedPhraseWrapper}>
								<View style={styles.colLeft}>
									{this.state.confirmedWords.slice(0, 6).map((word, i) => (
										<TouchableOpacity
											key={`word_${i}`}
											// eslint-disable-next-line react/jsx-no-bind
											onPress={() => this.updateWordAtIndex(i)}
										>
											<Text
												style={[
													styles.word,
													i === this.state.currentIndex ? styles.currentWord : null
												]}
											>
												{word && `${i + 1}. ${word}`}
											</Text>
										</TouchableOpacity>
									))}
								</View>
								<View style={styles.colRight}>
									{this.state.confirmedWords.slice(-6).map((word, i) => (
										<TouchableOpacity
											// eslint-disable-next-line react/jsx-no-bind
											onPress={() => this.updateWordAtIndex(i + 6)}
											key={`word_${i}`}
										>
											<Text
												style={[
													styles.word,
													i + 6 === this.state.currentIndex ? styles.currentWord : null
												]}
											>
												{word && `${i + 7}. ${word}`}
											</Text>
										</TouchableOpacity>
									))}
								</View>
							</View>

							<View style={styles.words}>
								{this.words.map((word, i) => {
									const selected = this.state.confirmedWords.includes(word)
										? styles.selectedWord
										: null;
									const selectedText = selected ? styles.selectedWordText : null;
									return (
										<TouchableOpacity
											// eslint-disable-next-line react/jsx-no-bind
											onPress={() => this.selectWord(word, i)}
											style={[styles.selectableWord, selected]}
											key={`selectableWord_${i}`}
										>
											<Text style={[styles.selectableWordText, selectedText]}>{word}</Text>
										</TouchableOpacity>
									);
								})}
							</View>
						</View>
						<View style={styles.buttonWrapper}>
							<StyledButton
								containerStyle={styles.button}
								type={'confirm'}
								onPress={this.goNext}
								testID={'submit-button'}
								disabled={!(this.state.confirmedWords.filter(word => word === undefined).length === 0)}
							>
								{strings('account_backup_step_5.cta_text')}
							</StyledButton>
						</View>
					</View>
				</ScrollView>
			</SafeAreaView>
		);
	}
}

const mapDispatchToProps = dispatch => ({
	seedphraseBackedUp: () => dispatch(seedphraseBackedUp())
});

export default connect(
	null,
	mapDispatchToProps
)(AccountBackupStep5);