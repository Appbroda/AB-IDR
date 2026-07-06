import React, { useState } from "react";
import DynamicForm from "../components/DynamicForm";
import styled from "@emotion/styled";
import { theme } from "../utils/utils";
import {
  fetchTradplusUpdates,
  setTradplusUpdates,
} from "../apiUtils/tradplus.api.js";
import { downloadTradplusCSV } from "../utils/csv";

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

const FormContainer = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 20px;

  button {
    align-self: center;
    width: 100%;
    padding: 12px;
    margin-top: 10px;
    border-radius: 8px;
    cursor: pointer;
    font-weight: 600;
  }
`;

const StepperContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  margin-bottom: 40px;
  position: relative;
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
  color: ${(props) => (props.active || props.completed ? "#FFF" : "#6B7280")};
  transition: all 0.3s ease;
`;

const StepLabel = styled.span`
  margin-top: 8px;
  font-size: 0.85rem;
  color: ${(props) => (props.active ? theme.textMain : "#6B7280")};
  font-weight: ${(props) => (props.active ? "bold" : "normal")};
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

export default function Tradplus() {
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);

  const [fetchedData, setFetchedData] = useState(null);
  const [updatedData, setUpdatedData] = useState(null);

  const [authData, setAuthData] = useState(null);

  const tradplusSchema = [
    {
      name: "bearKey",
      label: "TradPlus Bear Key",
      type: "password",
      placeholder: "Enter Bear Key",
      required: true,
    },
    {
      name: "secretKey",
      label: "TradPlus Secret Key",
      type: "password",
      placeholder: "Enter Secret Key",
      required: true,
    },
  ];

  const fetchReviewData = async (data) => {
    try {
      setLoading(true);
      setAuthData(data);

      const response = await fetchTradplusUpdates(data);
      setFetchedData(response.data);
      setCurrentStep(2);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchUpdateData = async () => {
    try {
      setLoading(true);

      const response = await setTradplusUpdates(authData);
      setUpdatedData(response.data);
      setCurrentStep(3);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageWrapper>
      <PageCard>
        <PageTitle>TradPlus IDR Configuration</PageTitle>
        <StepperContainer>
          <StepItem>
            <StepCircle active={currentStep === 1} completed={currentStep > 1}>
              1
            </StepCircle>
            <StepLabel active={currentStep === 1}>Auth</StepLabel>
          </StepItem>

          <StepLine completed={currentStep > 1} />

          <StepItem>
            <StepCircle active={currentStep === 2} completed={currentStep > 2}>
              2
            </StepCircle>
            <StepLabel active={currentStep === 2}>Review</StepLabel>
          </StepItem>

          <StepLine completed={currentStep > 2} />

          <StepItem>
            <StepCircle active={currentStep === 3} completed={currentStep > 3}>
              3
            </StepCircle>
            <StepLabel active={currentStep === 3}>Confirm</StepLabel>
          </StepItem>
        </StepperContainer>

        <FormContainer>
          {currentStep === 1 && (
            <DynamicForm
              fields={tradplusSchema}
              onSubmit={fetchReviewData}
              submitText={loading ? "Fetching..." : "Fetch Updates"}
              disabled={loading}
            />
          )}

          {currentStep === 2 && (
            <>
              <p style={{ textAlign: "center", marginBottom: "20px" }}>
                Updates fetched successfully. Please review the data before
                proceeding.
              </p>
              <button
                onClick={() =>
                  downloadTradplusCSV(
                    fetchedData,
                    "tradplus_fetched_updates.csv",
                  )
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
                onClick={fetchUpdateData}
                disabled={loading}
                style={{
                  backgroundColor: theme.primary || "#007BFF",
                  color: "white",
                  border: "none",
                }}
              >
                {loading ? "Processing..." : "I confirm to proceed"}
              </button>
            </>
          )}

          {currentStep === 3 && (
            <>
              <p style={{ textAlign: "center", marginBottom: "20px" }}>
                Updates have been successfully applied.
              </p>
              <button
                onClick={() =>
                  downloadTradplusCSV(updatedData, "tradplus_final_updates.csv")
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
                  setCurrentStep(1);
                  setFetchedData(null);
                  setUpdatedData(null);
                  setAuthData(null);
                }}
                style={{
                  backgroundColor: "transparent",
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
