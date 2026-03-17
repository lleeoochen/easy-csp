import { useCallback, useState } from "react";
import { CSPBucketCardList } from "./CSPBucketCardList";
import { MonthSelector } from "../../components/MonthSelector";
import { getCurrentMonthYear } from "../../utils/dateUtils";
import { Page } from "../../components/Page";

const ConsciousSpendingPlanPage = () => {
  const { month: currentMonth, year: currentYear } = getCurrentMonthYear();
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [selectedYear, setSelectedYear] = useState(currentYear);

  const handleMonthSelect = useCallback((year: number, month: number) => {
    setSelectedYear(year);
    setSelectedMonth(month);
  }, []);

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
