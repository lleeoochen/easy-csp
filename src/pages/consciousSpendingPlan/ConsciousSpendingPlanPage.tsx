import { CSPBucketCardList } from "./CSPBucketCardList";
import { MonthSelector } from "../../components/MonthSelector";
import { Page } from "../../components/Page";
import { useMonthFilter } from "../../hooks/useMonthFilter";

const ConsciousSpendingPlanPage = () => {
  const { selectedYear, selectedMonth, handleMonthSelect } = useMonthFilter();

  return (
    <Page title="Conscious Spending Plan">
      <MonthSelector
        selectedMonth={selectedMonth}
        selectedYear={selectedYear}
        onMonthSelect={handleMonthSelect}
        className="mb-4"
      />
      <CSPBucketCardList
        selectedMonth={selectedMonth}
        selectedYear={selectedYear}
      />
    </Page>
  );
};

export default ConsciousSpendingPlanPage;
