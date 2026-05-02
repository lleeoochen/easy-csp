import { CSPBucketCardList } from "./CSPBucketCardList";
import { MonthSelector } from '@/components/MonthSelector';
import { Page } from '@/components/Page';
import { useMonthFilter } from '@/hooks/useMonthFilter';

const ConsciousSpendingPlanPage = () => {
  const { selectedYear, selectedMonth, handleMonthSelect } = useMonthFilter();

  return (
    <Page title="Conscious Spending Plan" maxWidth="full">
      <div className="flex flex-col lg:gap-10 w-full">
        <MonthSelector
          selectedMonth={selectedMonth}
          selectedYear={selectedYear}
          onMonthSelect={handleMonthSelect}
          className="mb-4"
        />
        <CSPBucketCardList
          selectedMonth={selectedMonth}
          selectedYear={selectedYear}
          className="lg:flex-1 "
        />
      </div>
    </Page>
  );
};

export default ConsciousSpendingPlanPage;
