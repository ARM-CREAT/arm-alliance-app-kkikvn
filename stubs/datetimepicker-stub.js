const React = require('react');
const { TextInput } = require('react-native');
const DateTimePicker = ({ value, onChange, style }) => {
  return React.createElement(TextInput, {
    value: value ? (value instanceof Date ? value.toLocaleDateString('fr-FR') : String(value)) : '',
    onChangeText: (text) => { if (onChange) onChange({ type: 'set' }, new Date(text)); },
    placeholder: 'JJ/MM/AAAA',
    style: [{ borderWidth: 1, borderColor: '#ccc', padding: 8, borderRadius: 6 }, style],
  });
};
module.exports = DateTimePicker;
module.exports.default = DateTimePicker;
