# Marketplace Subgraph

Tracks featured (recognized) collections and (buy/sell) orders for the
CarbonSwap decentralized NFT marketplace.

## Dev Setup

Init this repo's dependencies

```
yarn
```

Init external dependencies (graph, ipfs)

```
git clone https://github.com/graphprotocol/graph-node/
cd graph-node/docker
```

Change line 20 in `docker-compose.yml` to
```
      ethereum: 'volta:https://volta-internal-archive.energyweb.org'
```

Run compose
```
docker-compose up
```



## Deploy (volta with local graph node)

```sh
# deploy marketplace contracts
cd ../marketplace
PRIVATE_KEY= PRIVATE_KEY2= yarn hardhat run scripts/deploy.js

# generate volta subgraph manifest (modify config/volta.json with correct contracts)
yarn prepare-volta

# generate entitites from contract ABIs and GraphQL schema
yarn codegen

# build assembly script (i.e. using mappings)
yarn build

# create subgraph on the graph node
yarn create-local

# deploy subgraph on the graph node
yarn deploy-local
```

Navigate to http://localhost:8000/subgraphs/name/moonsama/marketplace

Example query:
```
{
  orders {
    id,
    seller {
      id
    },
    sellAsset {
      id
    },
    buyAsset {
      id
    },
    strategy {
      id
    },
    salt,
    active,
    createdAt,
    cancel {
      id
    },
    strategyType {
    	id
    },
    strategy {
      id
    },
    fills {
      id,
      buyer {
        id
      },
      sellerSentAmount,
      sellerSendsAmountFull,
      buyerSendsAmountFull,
      buyerSentAmount,
      complete,
      order {
        id
      },
      
    }
  },
  simpleOrderStrategies {
    id,
    quantity,
    startsAt,
    expiresAt,
    askPerUnitNominator,
    askPerUnitDenominator,
    onlyTo,
    partialAllowed
  },
  strategyTypes {
    id,
    address
  }
}
```


query getUserActiveOrders {
    
_meta {
  block {
    hash,
    number
  }
}

    orders(where: {active: true, pricePerUnit_lte: "2500000000000000000000000000000000000000", pricePerUnit_gte: "1000000000000000000000000000000000000", buyAsset_in: ["0xb654611f84a8dc429ba3cb4fda9fad236c505a1a-975","0xb654611f84a8dc429ba3cb4fda9fad236c505a1a-978","0xb654611f84a8dc429ba3cb4fda9fad236c505a1a-993","0xb654611f84a8dc429ba3cb4fda9fad236c505a1a-997"]}, orderBy: createdAt, orderDirection: desc) {
      
    id
    orderType
    seller {
      id
    }
    sellAsset {
      
    id,
    assetId,
    assetType,
    assetAddress

    }
    buyAsset {
      
    id,
    assetId,
    assetType,
    assetAddress

    }
    strategyType {
      id
    }
    salt
    createdAt
    active
    cancel {
      
    id
    sellerGetsBackAmount
    createdAt

    }
    fills {
      
    id
    buyer {
      id
    }
    buyerSendsAmountFull
    buyerSentAmount
    sellerSendsAmountFull
    sellerSentAmount
    complete
    createdAt
    order {
      id
    }

    }
    quantity
    quantityLeft
    startsAt
    expiresAt
    askPerUnitNominator
    askPerUnitDenominator
    onlyTo
    partialAllowed
    pricePerUnit

    }
  }