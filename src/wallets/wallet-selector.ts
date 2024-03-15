"use client";
import { create as createStore } from "zustand";
import { distinctUntilChanged, map } from "rxjs";
import { providers } from "near-api-js";
import {
  Network,
  NetworkId,
  WalletSelector,
  setupWalletSelector,
} from "@near-wallet-selector/core";
import { setupModal } from "@near-wallet-selector/modal-ui";
import { setupMyNearWallet } from "@near-wallet-selector/my-near-wallet";
import { setupHereWallet } from "@near-wallet-selector/here-wallet";

import { useEffect, useState } from "react";

type ViewMethod = (
  contractId: string,
  method: string,
  args?: {}
) => Promise<string>;

type CallMethod = (
  contractId: string,
  method: string,
  args?: {},
  gas?: string,
  deposit?: number
) => Promise<string>;

type Wallet = {
  signedAccountId: string;
  logOut: () => void;
  logIn: () => void;
  selector: Promise<WalletSelector>;
  viewMethod: ViewMethod;
  callMethod: CallMethod;
  setLogActions: ({
    logOut,
    logIn,
  }: {
    logOut: () => void;
    logIn: () => void;
  }) => void;
  setAuth: ({ signedAccountId }: { signedAccountId: string }) => void;
  setMethods: ({
    viewMethod,
    callMethod,
  }: {
    viewMethod: ViewMethod;
    callMethod: CallMethod;
  }) => void;
  setStoreSelector: ({
    selector,
  }: {
    selector: Promise<WalletSelector>;
  }) => void;
};

export const useWallet = createStore<Wallet>((set) => ({
  signedAccountId: "",
  logOut: () => null,
  logIn: () => null,
  selector: new Promise(() => {}),
  viewMethod: () => new Promise(() => {}),
  callMethod: () => new Promise(() => {}),
  setLogActions: ({ logOut, logIn }) => set({ logOut, logIn }),
  setAuth: ({ signedAccountId }) => set({ signedAccountId }),
  setMethods: ({ viewMethod, callMethod }) => set({ viewMethod, callMethod }),
  setStoreSelector: ({ selector }) => set({ selector }),
}));

type InitWallet = {
  createAccessKeyFor: string;
  networkId: NetworkId | Network;
};

export function useInitWallet({ createAccessKeyFor, networkId }: InitWallet) {
  const setAuth = useWallet((store) => store.setAuth);
  const setLogActions = useWallet((store) => store.setLogActions);
  const setMethods = useWallet((store) => store.setMethods);
  const setStoreSelector = useWallet((store) => store.setStoreSelector);
  const [selector, setSelector] = useState<Promise<WalletSelector> | undefined>(
    undefined
  );

  useEffect(() => {
    const selector = setupWalletSelector({
      network: networkId,
      modules: [setupMyNearWallet(), setupHereWallet()],
    });

    console.log(selector)

    setSelector(selector);
    setStoreSelector({ selector });
  }, [networkId, setStoreSelector]);

  useEffect(() => {
    if (!selector) return;

    selector.then((walletSelector) => {
      const accounts = walletSelector.store.getState().accounts;
      const signedAccountId =
        accounts.find((account) => account.active)?.accountId || "";
      setAuth({ signedAccountId });

      walletSelector.store.observable
        .pipe(
          map((state) => state.accounts),
          distinctUntilChanged()
        )
        .subscribe((accounts) => {
          const signedAccountId =
            accounts.find((account) => account.active)?.accountId || "";
          setAuth({ signedAccountId });
        });
    });
  }, [selector, setAuth]);

  useEffect(() => {
    if (!selector) return;

    // defined logOut and logIn actions
    const logOut = async () => {
      const wallet = await (await selector).wallet();
      await wallet.signOut();
      setAuth({ signedAccountId: "" });
    };

    const logIn = async () => {
      const modal = setupModal(await selector, {
        contractId: createAccessKeyFor,
      });
      modal.show();
    };

    setLogActions({ logOut, logIn });
  }, [createAccessKeyFor, selector, setAuth, setLogActions]);

  useEffect(() => {
    if (!selector) return;

    const viewMethod = async (
      contractId: string,
      method: string,
      args = {}
    ) => {
      const { network } = (await selector).options;
      const provider = new providers.JsonRpcProvider({ url: network.nodeUrl });

      let res: any = await provider.query({
        request_type: "call_function",
        account_id: contractId,
        method_name: method,
        args_base64: Buffer.from(JSON.stringify(args)).toString("base64"),
        finality: "optimistic",
      });
      console.log(res);
      return JSON.parse(Buffer.from(res.result).toString());
    };

    const callMethod = async (
      contractId: string,
      method: string,
      args = {},
      gas = "30000000000000",
      deposit = 0
    ) => {
      const wallet = await (await selector).wallet();

      const outcome = await wallet.signAndSendTransaction({
        receiverId: contractId,
        actions: [
          {
            type: "FunctionCall",
            params: {
              methodName: method,
              args,
              gas,
              deposit: deposit.toString(),
            },
          },
        ],
      });
      if (!outcome) {
        return null;
      }

      return providers.getTransactionLastResult(outcome);
    };

    setMethods({ viewMethod, callMethod });
  }, [selector, setMethods]);
}
