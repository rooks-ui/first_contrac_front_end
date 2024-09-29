import { useEffect, useState } from "react";
import { MainContract } from "../contracts/MainContract";
import { useTonClient } from "./useTonClient";
import { useAsyncInitialize } from "./useAsyncInitialize";
import { Address, toNano} from "@ton/core";
import { useTonConnect } from "./useTonconnect";


export function useMainContract() {
  const client = useTonClient();
  const { sender } = useTonConnect();

  const sleep = ( time: number) =>
    new Promise((resolve) => setTimeout(resolve, time));


  const [contractData, setContractData] = useState<null | {
    counter_value: number;
    recent_sender: Address;
    owner_address: Address;
  }>();

  const [balance, setBalance] = useState<null | number>(0);

  const mainContract = useAsyncInitialize(async () => {
    if (!client) return;
    const contract = new MainContract(
      Address.parse("EQBmOkCEa-vroeG7sTZHbkHS4CI1cU6MATkbpe5OcozhCzq_"),
    );

    return client.open(contract);
  }, 
  [client]);

  useEffect(() => {
    async function getValue() {
      if (!mainContract) return;
      setContractData(null);
      try{
        const val = await mainContract.getData();
        const balanceData = await mainContract.getBalance();
        setContractData({
          counter_value: val.number,
          recent_sender: val.recent_sender,
          owner_address: val.owner_address,
        });

        setBalance(balanceData.number);

        await sleep(500);
        getValue();
      } catch(error) {
        console.error('Error fetching contract data:', error);
        setContractData(null);
        setBalance(null);
      }
      }
      getValue();
  }, [mainContract]);

  return {
    contract_address: mainContract?.address.toString(),
    contract_balance: balance,
    ...contractData,
    sendIncrement: async () => {
      return mainContract?.sendIncrement(sender, toNano("0.05"), 5)
    },
    sendDeposit: async() => {
      return mainContract?.sendDeposit(sender, toNano("1"));
    },
    sendWithdrawalRequest: async() => {
      return mainContract?.sendWithdrawalRequest(sender, toNano("0.05"), toNano("0.7"));
    },

  };
}