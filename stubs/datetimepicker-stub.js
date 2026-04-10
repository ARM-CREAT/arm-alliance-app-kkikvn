const React = require('react');
const { TextInput } = require('react-native');
/* eslint-disable react/prop-types */
const DateTimePicker = (props) => {
  return React.createElement(TextInput, {
    value: props.value ? new Date(props.value).toLocaleDateString() : '',
    onChangeText: () => {},
    placeholder: 'Date',
    style: props.style,
  });
};
module.exports = DateTimePicker;
module.exports.default = DateTimePicker;
