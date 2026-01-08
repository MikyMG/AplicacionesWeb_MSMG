import { useState } from 'react';

export default function useForm(initialValues = {}) {
  const [values, setValues] = useState(initialValues);

  const handleChange = (field, value) => {
    setValues(prev => ({ ...prev, [field]: value }));
  };

  const reset = () => setValues(initialValues);

  return { values, setValues, handleChange, reset };
}
