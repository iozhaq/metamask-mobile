import React from 'react';
import PropTypes from 'prop-types';
import { StyleSheet } from 'react-native';
import Modal from 'react-native-modal';
import { strings } from '../../../../locales/i18n';
import ActionContent from './ActionContent';

const styles = StyleSheet.create({
	modal: {
		margin: 0,
		width: '100%'
	}
});

/**
 * View that renders an action modal
 */
export default function ActionModal({
	cancelTestID,
	confirmTestID,
	cancelText,
	children,
	confirmText,
	confirmDisabled,
	cancelButtonMode,
	confirmButtonMode,
	displayCancelButton,
	displayConfirmButton,
	onCancelPress,
	onConfirmPress,
	onRequestClose,
	modalVisible
}) {
	return (
		<Modal
			isVisible={modalVisible}
			style={styles.modal}
			onBackdropPress={onRequestClose}
			onBackButtonPress={onRequestClose}
			onSwipeComplete={onRequestClose}
			swipeDirection={'down'}
		>
			<ActionContent
				cancelTestID={cancelTestID}
				confirmTestID={confirmTestID}
				cancelText={cancelText}
				confirmText={confirmText}
				confirmDisabled={confirmDisabled}
				cancelButtonMode={cancelButtonMode}
				confirmButtonMode={confirmButtonMode}
				displayCancelButton={displayCancelButton}
				displayConfirmButton={displayConfirmButton}
				onCancelPress={onCancelPress}
				onConfirmPress={onConfirmPress}
			>
				{children}
			</ActionContent>
		</Modal>
	);
}

ActionModal.defaultProps = {
	cancelButtonMode: 'neutral',
	confirmButtonMode: 'warning',
	confirmTestID: '',
	cancelTestID: '',
	cancelText: strings('action_view.cancel'),
	confirmText: strings('action_view.confirm'),
	confirmDisabled: false,
	displayCancelButton: true,
	displayConfirmButton: true
};

ActionModal.propTypes = {
	/**
	 * TestID for the cancel button
	 */
	cancelTestID: PropTypes.string,
	/**
	 * TestID for the confirm button
	 */
	confirmTestID: PropTypes.string,
	/**
	 * Text to show in the cancel button
	 */
	cancelText: PropTypes.string,
	/**
	 * Content to display above the action buttons
	 */
	children: PropTypes.node,
	/**
	 * Type of button to show as the cancel button
	 */
	cancelButtonMode: PropTypes.oneOf(['cancel', 'neutral', 'confirm', 'normal']),
	/**
	 * Type of button to show as the confirm button
	 */
	confirmButtonMode: PropTypes.oneOf(['normal', 'confirm', 'warning']),
	/**
	 * Whether confirm button is disabled
	 */
	confirmDisabled: PropTypes.bool,
	/**
	 * Text to show in the confirm button
	 */
	confirmText: PropTypes.string,
	/**
	 * Whether cancel button should be displayed
	 */
	displayCancelButton: PropTypes.bool,
	/**
	 * Whether confirm button should be displayed
	 */
	displayConfirmButton: PropTypes.bool,
	/**
	 * Called when the cancel button is clicked
	 */
	onCancelPress: PropTypes.func,
	/**
	 * Called when the confirm button is clicked
	 */
	onConfirmPress: PropTypes.func,
	/**
	 * Called when hardware back button on Android is clicked
	 */
	onRequestClose: PropTypes.func,
	/**
	 * Whether modal is shown
	 */
	modalVisible: PropTypes.bool
};
