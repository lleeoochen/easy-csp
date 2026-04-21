import { useCallback, useEffect, useMemo, useState } from 'react';
import { httpsCallable, getFunctions } from "firebase/functions";
import { type LinkTokenCreateRequest, type LinkTokenCreateResponse } from 'plaid';
import { usePlaidLink, type PlaidLinkOptions } from 'react-plaid-link';
import { isDevEnvironment } from '@/utils/envUtils';
import { Button } from './common/button';
import { useMarkInstitutionForResync } from '@/hooks/api/useFinancialInstitutions';

interface LinkFinancialInstitutionButtonProps {
  buttonText?: string;
  className?: string;
  /** When provided, opens Plaid Link in update mode for this institution */
  institutionDocId?: string;
  /** The Plaid item ID (institutionId field), required when institutionDocId is set */
  institutionId?: string;
}

const LinkFinancialInstitutionButton = ({
  buttonText = "Add Account",
  className = "",
  institutionDocId,
  institutionId,
}: LinkFinancialInstitutionButtonProps) => {
  const [plaidLinkToken, setPlaidLinkToken] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const functions = getFunctions();
  const isUpdateMode = !!institutionDocId && !!institutionId;
  const { mutate: markForResync } = useMarkInstitutionForResync();

  const initializePlaidLink = useCallback(async () => {
    try {
      setIsLoading(true);
      if (isUpdateMode) {
        const createUpdateLinkToken = httpsCallable<{ institution_id: string }, LinkTokenCreateResponse>(
          functions, 'createUpdateLinkToken'
        );
        const result = await createUpdateLinkToken({ institution_id: institutionId });
        setPlaidLinkToken(result.data.link_token);
      } else {
        const createLinkToken = httpsCallable<LinkTokenCreateRequest, LinkTokenCreateResponse>(
          functions, 'createLinkToken'
        );
        const result = await createLinkToken();
        setPlaidLinkToken(result.data.link_token);
      }
    } catch (error) {
      console.error("Error initializing Plaid Link:", error);
    } finally {
      setIsLoading(false);
    }
  }, [functions, isUpdateMode, institutionId]);

  const config: PlaidLinkOptions = useMemo<PlaidLinkOptions>(() => ({
    onSuccess: async (public_token) => {
      if (isUpdateMode) {
        // Update mode: item already exists, just trigger a re-sync
        markForResync(institutionDocId);
      } else {
        const exchangeForPlaidAccessToken = httpsCallable<{ public_token: string }, unknown>(
          functions, 'exchangeForPlaidAccessToken'
        );
        await exchangeForPlaidAccessToken({ public_token });
      }
      window.location.reload();
    },
    onExit: (err) => {
      if (err) console.error("Plaid Link Exit Error:", err);
    },
    onEvent: (eventName, metadata) => {
      console.log(`Plaid Link Event: ${eventName}`, metadata);
    },
    token: plaidLinkToken,
    env: isDevEnvironment ? 'sandbox' : 'production',
  }), [plaidLinkToken, functions, isUpdateMode, institutionDocId, markForResync]);

  const { open, ready } = usePlaidLink(config);

  useEffect(() => {
    if (plaidLinkToken && ready) open();
  }, [plaidLinkToken, ready, open]);

  return (
    <Button
      variant="primary"
      onClick={initializePlaidLink}
      disabled={isLoading}
      className={className}
    >
      {isLoading ? "Loading..." : buttonText}
    </Button>
  );
};

export default LinkFinancialInstitutionButton;
