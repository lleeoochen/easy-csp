import { Page } from '../../components/Page';
import { useNetWorth } from '../../hooks/api/useNetWorth';
import { NetWorthSummary } from './NetWorthSummary';
import { NetWorthGroupedBarChart } from './NetWorthGroupedBarChart';

const NetWorthPage = () => {
  const { data: breakdown, isLoading, error } = useNetWorth();

  if (isLoading) {
    return (
      <Page title="Net Worth" maxWidth="full">
        <div className="p-8 text-center">
          <div className="animate-pulse">Loading net worth data...</div>
        </div>
      </Page>
    );
  }

  if (error) {
    return (
      <Page title="Net Worth" maxWidth="full">
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600">Error loading net worth: {(error as Error).message}</p>
        </div>
      </Page>
    );
  }

  return (
    <Page title="Net Worth" maxWidth="full">
      {breakdown && (
        <div className='flex flex-col lg:flex-row gap-5 justify-center'>
          <NetWorthSummary breakdown={breakdown} />
          <NetWorthGroupedBarChart breakdown={breakdown} />
        </div>
      )}
    </Page>
  );
};

export default NetWorthPage;
