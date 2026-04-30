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

      // // Example 1: Import a pending transaction
      // await testImport({
      //   transaction: {
      //     transaction_id: "pending_coffee_1",
      //     account_id: "KqGJbvo1g1hwdzg5kaRRfRoEAb5pJ8fRvMq3B", // Replace with your actual account_id
      //     name: "Starbucks New",
      //     amount: 5.50,
      //     date: "2026-04-21",
      //     pending: true,
      //     personal_finance_category: {
      //       primary: "FOOD_AND_DRINK",
      //       detailed: "FOOD_AND_DRINK_COFFEE",
      //       confidence_level: "HIGH"
      //     }
      //   },
      //   institutionId: "P39JKvl8G8fQAaW5EoxxfzDzVE7MwwCw8Mqro" // Replace with your actual institutionId
      // });

      // Example 2: Import the posted version (this should remove the pending one)
      const postedResult = await testImport({
        transaction: {
          transaction_id: "posted_coffee_2",
          account_id: "KqGJbvo1g1hwdzg5kaRRfRoEAb5pJ8fRvMq3B", // Same account
          name: "Starbucks New 2",
          amount: 5.50,
          date: "2026-04-21",
          pending: false,
          pending_transaction_id: "pending_coffee_1", // Link to pending transaction
          personal_finance_category: {
            primary: "FOOD_AND_DRINK",
            detailed: "FOOD_AND_DRINK_COFFEE",
            confidence_level: "HIGH"
          }
        },
        institutionId: "P39JKvl8G8fQAaW5EoxxfzDzVE7MwwCw8Mqro"
      });

      console.log("✅ Posted transaction imported (pending should be removed):", postedResult.data);
      // setTestResult("✅ Success! Imported pending→posted conversion. Check transactions page.");
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
        {testLoading ? 'Importing...' : 'Test Pending→Posted Conversion'}
      </Button>
      {testResult && (
        <p className="mt-2 text-sm">{testResult}</p>
      )}
    </div>
  );
};
