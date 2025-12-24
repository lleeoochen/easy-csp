import { useCallback, useEffect, useMemo, useState } from 'react';
import { httpsCallable, getFunctions } from "firebase/functions";
import { type LinkTokenCreateRequest, type LinkTokenCreateResponse } from 'plaid';
import { usePlaidLink, type PlaidLinkOptions } from 'react-plaid-link';

interface LinkFinancialInstitutionButtonProps {
  buttonText?: string;
  className?: string;
}

const LinkFinancialInstitutionButton = ({
  buttonText = "Link Financial Institution",
  className = ""
}: LinkFinancialInstitutionButtonProps) => {
  const [plaidLinkToken, setPlaidLinkToken] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const functions = getFunctions();

  const initializePlaidLink = useCallback(async () => {
    try {
      setIsLoading(true);
      const createLinkToken = httpsCallable<LinkTokenCreateRequest, LinkTokenCreateResponse>(functions, 'createLinkToken');
      const result = await createLinkToken();
      setPlaidLinkToken(result.data.link_token);
    }
    catch (error) {
      console.error("Error initializing Plaid Link:", error);
    }
    finally {
      setIsLoading(false);
    }
  }, [functions]);

  const config: PlaidLinkOptions = useMemo(() => ({
    onSuccess: async (public_token) => {
      const exchangeForPlaidAccessToken = httpsCallable<{public_token: string}, unknown>(functions, 'exchangeForPlaidAccessToken');
      await exchangeForPlaidAccessToken({
        public_token: public_token
      });
    },
    onExit: (err) => {
      console.error("id Link Exit Error:", err);
    },
    onEvent: (eventName, metadata) => {
      console.log(`Plaid Link Event: ${eventName}`, metadata);
    },
    token: plaidLinkToken,
    env: 'sandbox'
  }), [plaidLinkToken, functions]);

  const { open, ready } = usePlaidLink(config);

  // Automatically open Plaid Link when token is set and ready
  useEffect(() => {
    if (plaidLinkToken && ready) {
      open();
    }
  }, [plaidLinkToken, ready, open]);

  return (
    <button
      onClick={initializePlaidLink}
      disabled={isLoading}
      className={className}
    >
      {isLoading ? "Loading..." : buttonText}
    </button>
  );
};

export default LinkFinancialInstitutionButton;
