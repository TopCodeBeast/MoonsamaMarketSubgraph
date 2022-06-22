import { BigInt } from "@graphprotocol/graph-ts"
// export const IPFS_GATEWAYS = [
//     'https://moonsama.mypinata.cloud',
//     'https://cloudflare-ipfs.com',
//     'https://ipfs.io',
// ];

export function toAssetType(assetType: BigInt): string {
    if (assetType.equals(BigInt.fromI32(1))) {
        return 'NATIVE'
    }
    if (assetType.equals(BigInt.fromI32(2))) {
        return 'ERC20'
    }
    if (assetType.equals(BigInt.fromI32(3))) {
        return 'ERC721'
    }
    if (assetType.equals(BigInt.fromI32(4))) {
        return 'ERC1155'
    }
    return 'UNKNOWN'
}

export function strategyMap(key: string): string {
    if (key === 'SIMPLE') {
        return '0xb4c34ccd96d70009be083eaea45c708dff031622381acfcf6e3d07039aca39bb'
    }

    if (key === 'LINEAR') {
        return '0xd181dd98be0533fd6c6f083caf4a691d4f946e1c6c9682e4194032c0dad96acb'
    }
    return '0x'
}

export function getPPU(orderType: string, nominator: BigInt, denominator: BigInt): BigInt {
    let pow18 = BigInt.fromI32(10).pow(18)
    if (orderType === 'BUY') {
        return pow18.times(denominator).div(nominator)
    }

    if (orderType === 'SELL') {
        return pow18.times(nominator).div(denominator)
    }
    return BigInt.fromI32(0)
}

export function getPPUFill(orderType: string, buyerSendsAmountFull: BigInt, sellerSendsAmountFull: BigInt): BigInt {
    let pow18 = BigInt.fromI32(10).pow(18)
    if (orderType === 'BUY') {
        return pow18.times(sellerSendsAmountFull).div(buyerSendsAmountFull)
    }
    if (orderType === 'SELL') {
        return pow18.times(buyerSendsAmountFull).div(sellerSendsAmountFull)
    }

    return BigInt.fromI32(0)
}

// export function uriToHttp(
//     uri?: string,
//     tryHttpToHttps: boolean = true
// ): string[] {
//     if (!uri) {
//         return [];
//     }
//     const protocol = uri.split(':')[0].toLowerCase();
//     switch (protocol) {
//         case 'https':
//             return [uri];
//         case 'http':
//             return tryHttpToHttps ? ['https' + uri.substr(4), uri] : [uri];
//         case 'ipfs':
//             const hash = uri.match(/^ipfs:(\/\/)?(.*)$/i)?.[2];
//             return IPFS_GATEWAYS.map((x) => `${x}/ipfs/${hash}`);
//         case 'ipns':
//             const name = uri.match(/^ipns:(\/\/)?(.*)$/i)?.[2];
//             return IPFS_GATEWAYS.map((x) => `${x}/ipns/${name}`);
//         default:
//             return [];
//     }
// }

// export function uriToHttp1(
//     uri?: string,
//     tryHttpToHttps: boolean = true
// ): string[] {
//     if (!uri) {
//         return [];
//     }
//     const urls = uri.split('/');
//     const hash = urls[urls.length];
//     return IPFS_GATEWAYS.map((x) => `${x}/ipfs/${hash}`);
// }
