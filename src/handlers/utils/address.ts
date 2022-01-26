import { encodeAddress } from '@polkadot/util-crypto';

export const anyChainSs58Prefix = 42
export function useAnyChainAddress(address: string, isShort = false): string {
  return convertToSS58(address, anyChainSs58Prefix, isShort);
}

export function convertToSS58(text: string, prefix: number, isShort = false): string {
    if (!text) return '';
  
    try {
      let address = encodeAddress(text, prefix);
      const length = 8;
  
      if (isShort) {
        address = address.substring(0, length) + '...' + address.substring(address.length - length, length);
      }
  
      return address;
    } catch (error) {
      return '';
    }
  }