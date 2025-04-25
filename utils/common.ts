// Import viem transport, viem chain, and ENSjs
import { http } from "viem";
import { mainnet } from "viem/chains";
import { createPublicClient } from "viem";
import blockies from 'ethereum-blockies-base64';

const client = createPublicClient({
  chain: mainnet,
  transport: http(),
});

export const truncateAddress = (address: string) => {
  return address.slice(0, 6) + "..." + address.slice(-4);
};

export const getEnsName = async (address: string) => {
  try {
    const ensName = await client.getEnsName({
      address: address as `0x${string}`,
    });

    return ensName;
  } catch (error) {
    console.error("Error fetching ENS name:", error);
    throw new Error(
      "Failed to retrieve ENS name. Please check the address or network configuration."
    );
  }
};

export const getEnsAvatar = async (address: string) => {
  try {
    const ensName = await getEnsName(address);
    if (!ensName) {
      // Generate blockies avatar if no ENS avatar exists
      return blockies(address);
    }

    const avatar = await client.getEnsAvatar({
      name: ensName,
    });
    
    return avatar || blockies(address);
  } catch (error) {
    console.error("Error fetching ENS avatar:", error);
    throw new Error(
      "Failed to retrieve ENS avatar. Please check the address or network configuration."
    );
  }
};
