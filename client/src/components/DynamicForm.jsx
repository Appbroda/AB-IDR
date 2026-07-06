import React, { useState } from "react";
import styled from "@emotion/styled";
import { theme } from "../utils/utils";

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 20px;
  width: 100%;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const Label = styled.label`
  font-weight: 600;
  font-size: 0.9rem;
  color: ${theme.textMain};
`;

const inputStyles = `
  padding: 12px 14px;
  border: 1px solid ${theme.border};
  border-radius: 6px;
  font-size: 0.95rem;
  font-family: inherit;
  color: ${theme.textMain};
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
  
  &:focus {
    outline: none;
    border-color: ${theme.primary};
    box-shadow: 0 0 0 3px ${theme.primaryLight};
  }
`;

const Input = styled.input`
  ${inputStyles}
`;

const Button = styled.button`
  padding: 12px 24px;
  border: none;
  border-radius: 6px;
  background: ${theme.primary};
  color: white;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  align-self: flex-start;
  transition:
    opacity 0.2s ease,
    transform 0.1s ease;

  &:hover {
    opacity: 0.9;
  }

  &:active {
    transform: scale(0.98);
  }
`;

export default function DynamicForm({
  fields,
  onSubmit,
  submitText = "Submit",
}) {
  const initialState = fields.reduce((acc, field) => {
    acc[field.name] =
      field.defaultValue !== undefined ? field.defaultValue : "";
    return acc;
  }, {});

  const [values, setValues] = useState(initialState);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setValues((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(values);
  };

  const renderField = (field) => {
    return (
      <Input
        id={field.name}
        name={field.name}
        onChange={handleChange}
        required={field.required}
        type={field.type || "text"}
        value={values[field.name]}
        placeholder={field.placeholder}
      />
    );
  };

  return (
    <Form onSubmit={handleSubmit}>
      {fields.map((field) => (
        <FormGroup key={field.name}>
          <Label htmlFor={field.name}>{field.label}</Label>
          {renderField(field)}
        </FormGroup>
      ))}
      <Button type="submit">{submitText}</Button>
    </Form>
  );
}
