import axios from "axios";

export type TokenActivity = {
  sender_address: string;
  first_tx_date: string; // First transaction date
};

async function fetchEtherscanTransactions(
  address: string,
  startblock: string,
  endblock: string
) {
  const api_key = process.env.ETHERSCAN_API_KEY!!;
  const etherscanAPIBaseURL = "https://api.etherscan.io";
  const url = `${etherscanAPIBaseURL}/api?module=account&action=txlist&address=${address}&startblock=${startblock}&endblock=${endblock}&sort=asc&apikey=${api_key}`;

  try {
    const response = await axios.get(url);
    return response.data;
  } catch (error) {
    console.error("Error fetching Etherscan transactions:", error);
    throw error;
  }
}

export type GeneralTxItem = {
  timeStamp: string;
};

function formatDate(timestamp: string): string {
  const date = new Date(parseInt(timestamp) * 1000);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}/${month}/${day}`;
}

export async function getTokenActivityBy(
  address: string
): Promise<TokenActivity> {
  const transactions = await getTransactionsOf(address);
  const firstTxDate =
    transactions.length > 0
      ? formatDate(transactions[0].timeStamp)
      : "2015/07/30"; // Ethereum launch date

  return {
    sender_address: address,
    first_tx_date: firstTxDate,
  };
}

async function getTransactionsOf(address: string): Promise<GeneralTxItem[]> {
  const response = await fetchEtherscanTransactions(address, "0", "latest");
  if (response.status === "0" && response.message === "No transactions found") {
    return [];
  }

  if (response.message !== "OK") {
    const msg = `Etherscan API error: ${JSON.stringify(response)}`;
    throw new Error(`Etherscan API failed: ${msg}`);
  }

  return response.result;
}
