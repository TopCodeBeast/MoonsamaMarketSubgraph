import { Address } from "@graphprotocol/graph-ts"
import { ERC20 as ERC20Contract } from "../generated/RecognizedCollections/ERC20"
import { ERC721 as ERC721Contract } from "../generated/RecognizedCollections/ERC721"
import { IERC721Enumerable as IERC721Enumerable } from "../generated/RecognizedCollections/IERC721Enumerable"
import { ERC1155 as ERC1155Contract } from "../generated/RecognizedCollections/ERC1155"
import { CollectionChanged } from "../generated/RecognizedCollections/RecognizedCollections"
import { ERC20, ERC721, ERC1155, RecognizedCollection, Metadata, Attribute } from "../generated/schema"
import { toAssetType } from "./utils"
// import { toAssetType, uriToHttp1 } from "./utils"
import { BigInt, log } from '@graphprotocol/graph-ts'
// import axios from 'axios';

export function onCollectionChanged(event: CollectionChanged): void {
    let id = event.params.collection.toHexString()
    let collection = RecognizedCollection.load(id)

    if (collection == null) {
        collection = new RecognizedCollection(id)
    }

    collection.assetType = toAssetType(event.params.assetType)
    collection.isAdded = event.params.isAdded

    // todo: query contract to get asset/metadata url (?)
    // - some data is potentially dynamic (e.g. erc20 totalSupply, erc1155 tokenURI)
    //   which we cannot track (?)
    // - we can save static data (name, symbol) in case we need it

    if (collection.isAdded) {
        if (collection.assetType == "ERC20") {
            getERC20(event.params.collection)
        }

        if (collection.assetType == "ERC721") {
            getERC721(event.params.collection)
        }

        if (collection.assetType == "ERC1155") {
            getERC1155(event.params.collection)
        }
    }

    collection.save()
}

function getERC20(address: Address): void {
    let id = address.toHexString()
    // only save once
    assert(ERC20.load(id) == null)

    let contract = ERC20Contract.bind(address)

    let erc20 = new ERC20(id)
    erc20.name = erc20.name || contract.name()
    erc20.symbol = erc20.symbol || contract.symbol()
    erc20.decimals = erc20.decimals || contract.decimals()
    erc20.save()
}

function getERC721(address: Address): void {
    let id = address.toHexString()
    assert(ERC721.load(id) == null)

    let contract = ERC721Contract.bind(address)

    let IERC721Enum = IERC721Enumerable.bind(address)
    let totalSupply = IERC721Enum.totalSupply()
    for (let index = 0; BigInt.fromI32(index + 1) < totalSupply; index++) {
        let newMetaId = id + index.toString()
        let newMeta = new Metadata(newMetaId)
        newMeta.tokenAddress = id;
        newMeta.tokenId = index;
        let tokenUri = contract.tokenURI(BigInt.fromI32(index))
        // const urls = uriToHttp1(tokenUri)
        // for (let i = 0; i < urls.length; i++) {
        //     try {
        //         const response = await axios.get(urls[i], {});
        //         if (response.status === 200) {
        //             newMeta.animationUrl = response.data.animationUrl;
        //             newMeta.artist_url = response.data.artist_url;
        //             newMeta.attributes = response.data.attributes;
        //             newMeta.description = response.data.description;
        //             newMeta.image = response.data.image;
        //             newMeta.name = response.data.name;
        //         }
        //     } catch (err) {
        //     }
        // }
    }
    log.debug("contract Meta", [totalSupply.toString()])

    let erc721 = new ERC721(id)
    erc721.name = contract.name()
    erc721.symbol = contract.symbol()
    erc721.save()
}

function getERC1155(address: Address): void {
    let id = address.toHexString()
    assert(ERC1155.load(id) == null)

    let erc1155 = new ERC1155(id)
    erc1155.save()
}

/**
 * Compilation finished successfully
devs: 0x9A1041bf873C60a826E8AA74cC95bCB74c8d0A0f 0xB26e1E1DDff9c6cf813AD40BB36f12DF54E2D028
73799
deploying warehouse..
deploying strategy registry..
deploying marketplace..
deploying simple strategy..
deploying recognized collections..
wiring things together 1..
wiring things together 2..
deploying dummies
wiring things together 3..
dummy contracts
    erc20: 0x88292d0B58291904449A3cFb8e9304a989B17e0c
    paymentErc20: 0xfaa53a53ACf50f1640063eB0Eaa829DAe4526d29
    erc721: 0x1f88C6209E1687C66b94d3D991b5b24f8CCAD734
    erc1155: 0x9D37c4AA4d67d4aAc66aA2A0Fe2231b5CD1b5e53
    erc721wSecondary: 0x596aBd5a7030264DcC04A8Ce81C2793c95031eb4
    erc1155wSecondary: 0x81BD1986cd71CCf77d6Ee7BeC6c31Fc2277A6f06
---------------
protocolFeeTo: 0xB26e1E1DDff9c6cf813AD40BB36f12DF54E2D028
swapListener: 0x0000000000000000000000000000000000000000
warehouse: 0xDdc28d13925E4269b2cBcD76E460C992547d4184
strategyRegistry: 0x503C105C06697f39A2a3a72FdFaca78eF0eb525D
marketplace: 0x582Be2e4654ebC22feB49907834452EfdD3E4d21
simplestrategy: 0x7C4bDfAC5BcdfaA7576D898fE004c243F46B8A67
recognizedCollections: 0xEb573Ea3Ff915185dB147D485D19b38abFE00726
 *
 *
 */
