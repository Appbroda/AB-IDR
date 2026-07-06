import React, { useState } from "react";
import DynamicForm from "../components/DynamicForm";
import { fetchUpdates, setUpdates } from "../apiUtils/ironsource.api";
import styled from "@emotion/styled";
import { theme } from "../utils/utils";
import { downloadIronsourceCSV, downloadUpdateResultsCsv } from "../utils/csv";

const PageWrapper = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  min-height: 100vh;
  padding: 20px;
  background-color: #f9fafb;
`;

const PageCard = styled.div`
  background: white;
  border-radius: 12px;
  padding: 40px;
  box-shadow:
    0 4px 6px -1px rgba(0, 0, 0, 0.05),
    0 2px 4px -1px rgba(0, 0, 0, 0.03);
  border: 1px solid ${theme.border};
  width: 100%;
  max-width: 550px;
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const PageTitle = styled.h2`
  margin-top: 0;
  margin-bottom: 24px;
  color: ${theme.textMain};
  font-size: 1.5rem;
  font-weight: 700;
  text-align: center;
`;

const StepperContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  margin-bottom: 40px;
`;

const StepItem = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  z-index: 1;
`;

const StepCircle = styled.div`
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  background-color: ${(props) =>
    props.active || props.completed ? theme.primary || "#007BFF" : "#E5E7EB"};
  color: ${(props) => (props.active || props.completed ? "#fff" : "#6B7280")};
  transition: all 0.3s ease;
`;

const StepLabel = styled.span`
  margin-top: 8px;
  font-size: 0.85rem;
  color: ${(props) => (props.active ? theme.textMain : "#6B7280")};
  font-weight: ${(props) => (props.active ? "600" : "400")};
`;

const StepLine = styled.div`
  flex: 1;
  height: 4px;
  background-color: ${(props) =>
    props.completed ? theme.primary || "#007BFF" : "#E5E7EB"};
  margin: 0 10px;
  margin-bottom: 24px;
  transition: all 0.3s ease;
`;

const FormContainer = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 12px;

  button {
    width: 100%;
    padding: 12px;
    border-radius: 8px;
    font-weight: 600;
    cursor: pointer;
  }
`;

export default function Ironsource() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  const [authData, setAuthData] = useState(null);
  const [fetchedData, setFetchedData] = useState(null);
  const [updatedData, setUpdatedData] = useState(null);

  const schema = [
    {
      name: "secretKey",
      label: "IS Secret Key",
      type: "password",
      placeholder: "Enter IS Secret Key",
      required: true,
    },
    {
      name: "refreshKey",
      label: "IS Refresh Key",
      placeholder: "Enter IS Refresh Key",
      type: "password",
      required: true,
    },
  ];

  const handleFetch = async (data) => {
    try {
      setLoading(true);
      setAuthData(data);

      const response = await fetchUpdates(data);
      setFetchedData(response.data);
      setStep(2);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    try {
      setLoading(true);

      const response = await setUpdates(authData);
      setUpdatedData(response.data);
      setStep(3);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageWrapper>
      <PageCard>
        <PageTitle>IronSource IDR Configuration</PageTitle>
        <StepperContainer>
          <StepItem>
            <StepCircle active={step === 1} completed={step > 1}>
              1
            </StepCircle>
            <StepLabel active={step === 1}>Auth</StepLabel>
          </StepItem>

          <StepLine completed={step > 1} />

          <StepItem>
            <StepCircle active={step === 2} completed={step > 2}>
              2
            </StepCircle>
            <StepLabel active={step === 2}>Review</StepLabel>
          </StepItem>

          <StepLine completed={step > 2} />

          <StepItem>
            <StepCircle active={step === 3} completed={step > 3}>
              3
            </StepCircle>
            <StepLabel active={step === 3}>Confirm</StepLabel>
          </StepItem>
        </StepperContainer>

        <FormContainer>
          {step === 1 && (
            <DynamicForm
              fields={schema}
              onSubmit={handleFetch}
              submitText={loading ? "Fetching..." : "Fetch Updates"}
              disabled={loading}
            />
          )}

          {step === 2 && (
            <>
              <p style={{ textAlign: "center", marginBottom: "8px" }}>
                Data fetched successfully. Please review before applying.
              </p>

              <button
                onClick={() =>
                  downloadIronsourceCSV(fetchedData, "is_preview_updates.csv")
                }
                style={{
                  backgroundColor: "#4CAF50",
                  color: "white",
                  border: "none",
                }}
              >
                Download Preview CSV
              </button>

              <button
                onClick={handleConfirm}
                disabled={loading}
                style={{
                  background: theme.primary || "#007BFF",
                  color: "white",
                  border: "none",
                }}
              >
                {loading ? "Processing..." : "Confirm & Apply"}
              </button>
            </>
          )}

          {step === 3 && (
            <>
              <p style={{ textAlign: "center", marginBottom: "8px" }}>
                Updates successfully applied.
              </p>

              <button
                onClick={() =>
                  downloadUpdateResultsCsv(updatedData, "is_final_updates.csv")
                }
                style={{
                  backgroundColor: "#4CAF50",
                  color: "white",
                  border: "none",
                }}
              >
                Download Final CSV
              </button>

              <button
                onClick={() => {
                  setStep(1);
                  setAuthData(null);
                  setFetchedData(null);
                  setUpdatedData(null);
                }}
                style={{
                  background: "transparent",
                  border: `1px solid ${theme.border}`,
                  color: theme.textMain,
                }}
              >
                Start Over
              </button>
            </>
          )}
        </FormContainer>
      </PageCard>
    </PageWrapper>
  );
}
