import { useState } from "react";
import { getFunctions, httpsCallable } from "firebase/functions";
import { Button } from "./common/button";

export const DevTestImport = () => {
  const [testLoading, setTestLoading] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);

  const handleTestImport = async () => {
    setTestLoading(true);
    setTestResult(null);

    try {
      const functions = getFunctions();
      const testImport = httpsCallable(functions, 'testImportPlaidTransaction');

      const result = await testImport({
        transaction: {
          transaction_id: "test_recology_" + Date.now(),
          account_id: "KqGJbvo1g1hwdzg5kaRRfRoEAb5pJ8fRvMq3B",
          name: "RECOLOGY INC",
          amount: 150.00,
          date: "2026-03-17",
          personal_finance_category: {
            primary: "RENT_AND_UTILITIES",
            detailed: "RENT_AND_UTILITIES_SEWAGE_AND_WASTE_MANAGEMENT",
            confidence_level: "HIGH"
          }
        },
        institutionId: "P39JKvl8G8fQAaW5EoxxfzDzVE7MwwCw8Mqro"
      });

      console.log("✅ Test import success:", result.data);
      setTestResult("✅ Success! Check console and transactions page.");
    } catch (error) {
      console.error("❌ Test import error:", error);
      setTestResult(`❌ Error: ${error.message}`);
    } finally {
      setTestLoading(false);
    }
  };

  return (
    <div>
      <Button
        variant="secondary"
        onClick={handleTestImport}
        disabled={testLoading}
      >
        {testLoading ? 'Importing...' : 'Test Import Transaction'}
      </Button>
      {testResult && (
        <p className="mt-2 text-sm">{testResult}</p>
      )}
    </div>
  );
};
