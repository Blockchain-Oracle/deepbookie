https://github.com/MystenLabs/ts-sdks/tree/main/packages/deepbook-v3

https://www.npmjs.com/package/@mysten/deepbook-v3

# BalanceManager SDK

URL: https://docs.sui.io/onchain-finance/deepbookv3-sdk/balance-manager

The `BalanceManager` is a core component of DeepBookV3 that holds all asset balances. The SDK provides comprehensive functions to create, manage, and interact with balance managers.

## Balance manager functions

The DeepBookV3 SDK provides the following functions for managing balance managers.

Click to open createAndShareBalanceManager Use `createAndShareBalanceManager` to create a new balance manager and automatically share it. The call returns a function that takes a `Transaction`object **Object** The basic unit of storage on Sui. .

Loadingâ€¦

Click to open createBalanceManagerWithOwner Use `createBalanceManagerWithOwner` to create a new balance manager with a custom owner. Returns the managerobject . The call returns a function that takes a `Transaction`object .

**Parameters**

- `ownerAddress` : String representing theaddress **Address** A unique, anonymous identity on a blockchain network. of the owner.
Loadingâ€¦

Click to open shareBalanceManager Use `shareBalanceManager` to share a balance manager that was created but not yet shared. The call returns a function that takes a `Transaction`object .

**Parameters**

- `manager` : `TransactionArgument` representing the balance manager to share.
Loadingâ€¦

## Deposit and withdraw functions

Click to open depositIntoManager Use `depositIntoManager` to deposit funds into a balance manager. The call returns a function that takes a `Transaction`object .

**Parameters**

- `managerKey` : String that identifies the balance manager.
- `coinKey` : String that identifies the coin to deposit.
- `amountToDeposit` : Number representing the amount to deposit.
Loadingâ€¦

Click to open withdrawFromManager Use `withdrawFromManager` to withdraw funds from a balance manager. The call returns a function that takes a `Transaction`object .

**Parameters**

- `managerKey` : String that identifies the balance manager.
- `coinKey` : String that identifies the coin to withdraw.
- `amountToWithdraw` : Number representing the amount to withdraw.
- `recipient` : String representing the recipientaddress .
Loadingâ€¦

Click to open withdrawAllFromManager Use `withdrawAllFromManager` to withdraw all funds of a specific coin type from a balance manager. The call returns a function that takes a `Transaction`object .

**Parameters**

- `managerKey` : String that identifies the balance manager.
- `coinKey` : String that identifies the coin to withdraw.
- `recipient` : String representing the recipientaddress .
Loadingâ€¦

Click to open checkManagerBalance Use `checkManagerBalance` to check the balance of a specific coin in a balance manager. The call returns a function that takes a `Transaction`object .

**Parameters**

- `managerKey` : String that identifies the balance manager.
- `coinKey` : String that identifies the coin to check.
Loadingâ€¦

## Trade proof functions

Click to open generateProof Use `generateProof` to generate a trade proof for the balance manager. Automatically calls the appropriate function based on whether a `tradeCap` is set. The call returns a function that takes a `Transaction`object .

**Parameters**

- `managerKey` : String that identifies the balance manager.
Loadingâ€¦

Click to open generateProofAsOwner Use `generateProofAsOwner` to generate a trade proof as the owner of the balance manager. The call returns a function that takes a `Transaction`object .

**Parameters**

- `managerId` : String representing the ID of the balance manager.
Loadingâ€¦

Click to open generateProofAsTrader Use `generateProofAsTrader` to generate a trade proof using a `tradeCap` . The call returns a function that takes a `Transaction`object .

**Parameters**

- `managerId` : String representing the ID of the balance manager.
- `tradeCapId` : String representing the ID of the trade cap.
Loadingâ€¦

## Capability functions

Click to open mintTradeCap Use `mintTradeCap` to mint a `tradeCap` for the balance manager. The call returns a function that takes a `Transaction`object .

**Parameters**

- `managerKey` : String that identifies the balance manager.
Loadingâ€¦

Click to open mintDepositCap Use `mintDepositCap` to mint a `depositCap` for the balance manager. The call returns a function that takes a `Transaction`object .

**Parameters**

- `managerKey` : String that identifies the balance manager.
Loadingâ€¦

Click to open mintWithdrawalCap Use `mintWithdrawalCap` to mint a `withdrawCap` for the balance manager. The call returns a function that takes a `Transaction`object .

**Parameters**

- `managerKey` : String that identifies the balance manager.
Loadingâ€¦

Click to open depositWithCap Use `depositWithCap` to deposit funds into a balance manager using a `depositCap` . The call returns a function that takes a `Transaction`object .

**Parameters**

- `managerKey` : String that identifies the balance manager.
- `coinKey` : String that identifies the coin to deposit.
- `amountToDeposit` : Number representing the amount to deposit.
Loadingâ€¦

Click to open withdrawWithCap Use `withdrawWithCap` to withdraw funds from a balance manager using a `withdrawCap` . The call returns a function that takes a `Transaction`object .

**Parameters**

- `managerKey` : String that identifies the balance manager.
- `coinKey` : String that identifies the coin to withdraw.
- `amountToWithdraw` : Number representing the amount to withdraw.
Loadingâ€¦

Click to open revokeTradeCap Use `revokeTradeCap` to revoke a `TradeCap` . This also revokes the associated `DepositCap` and `WithdrawCap` . The call returns a function that takes a `Transaction`object .

**Parameters**

- `managerKey` : String that identifies the balance manager.
- `tradeCapId` : String representing the ID of the TradeCap to revoke.
Loadingâ€¦

## Referral functions

Click to open setBalanceManagerReferral Use `setBalanceManagerReferral` to set a pool-specific referral for the balance manager. Requires a `tradeCap` for permission checking. The call returns a function that takes a `Transaction`object .

**Parameters**

- `managerKey` : String that identifies the balance manager.
- `referral` : String representing the referral ID (DeepBookPoolReferral).
- `tradeCap` : `TransactionArgument` representing the trade cap for permission.
Loadingâ€¦

Click to open unsetBalanceManagerReferral Use `unsetBalanceManagerReferral` to remove a referral from the balance manager for a specific pool. Requires a `tradeCap` for permission checking. The call returns a function that takes a `Transaction`object .

**Parameters**

- `managerKey` : String that identifies the balance manager.
- `poolKey` : String that identifies the pool to unset the referral for.
- `tradeCap` : `TransactionArgument` representing the trade cap for permission.
Loadingâ€¦

Click to open getBalanceManagerReferralId Use `getBalanceManagerReferralId` to get the referral ID associated with a balance manager for a specific pool. The call returns a function that takes a `Transaction`object .

**Parameters**

- `managerKey` : String that identifies the balance manager.
- `poolKey` : String that identifies the pool.
Loadingâ€¦

## Registry functions

Click to open registerBalanceManager Use `registerBalanceManager` to register a balance manager with the registry. The call returns a function that takes a `Transaction`object .

**Parameters**

- `managerKey` : String that identifies the balance manager.
Loadingâ€¦

## Read-only functions

Click to open owner Use `owner` to get the owneraddress of a balance manager. The call returns a function that takes a `Transaction`object .

**Parameters**

- `managerKey` : String that identifies the balance manager.
Loadingâ€¦

Click to open id Use `id` to get the ID of a balance manager. The call returns a function that takes a `Transaction`object .

**Parameters**

- `managerKey` : String that identifies the balance manager.
Loadingâ€¦

Click to open balanceManagerReferralOwner Use `balanceManagerReferralOwner` to get the owneraddress of a pool referral (DeepBookPoolReferral). The call returns a function that takes a `Transaction`object .

**Parameters**

- `referralId` : String representing the ID of the referral.
Loadingâ€¦

Click to open balanceManagerReferralPoolId Use `balanceManagerReferralPoolId` to get the pool ID associated with a pool referral (DeepBookPoolReferral). The call returns a function that takes a `Transaction`object .

**Parameters**

- `referralId` : String representing the ID of the referral.
Loadingâ€¦

## Examples

The following examples demonstrate common balance manager operations.

### Create and share a balance manager

```tsx
// Example: Create and share a new balance manager
createBalanceManager = (tx: Transaction) => {
	tx.add(this.balanceManager.createAndShareBalanceManager());
};
```

### Create a balance manager with custom owner

```tsx
// Example: Create a balance manager with custom owner and share it
createManagerWithOwner = (tx: Transaction) => {
	const ownerAddress = '0x123...';

	// Create the manager with custom owner
	const manager = tx.add(this.balanceManager.createBalanceManagerWithOwner(ownerAddress));

	// Share the manager
	tx.add(this.balanceManager.shareBalanceManager(manager));
};
```

### Deposit and withdraw funds

```tsx
// Example: Deposit USDC into a balance manager
depositFunds = (tx: Transaction) => {
	const managerKey = 'MANAGER_1';
	const coinKey = 'DBUSDC';
	const amount = 1000; // 1000 USDC

	tx.add(this.balanceManager.depositIntoManager(managerKey, coinKey, amount));
};

// Example: Withdraw SUI from a balance manager
withdrawFunds = (tx: Transaction) => {
	const managerKey = 'MANAGER_1';
	const coinKey = 'SUI';
	const amount = 100; // 100 SUI
	const recipient = '0x456...';

	tx.add(this.balanceManager.withdrawFromManager(managerKey, coinKey, amount, recipient));
};

// Example: Withdraw all DEEP from a balance manager
withdrawAllDeep = (tx: Transaction) => {
	const managerKey = 'MANAGER_1';
	const coinKey = 'DEEP';
	const recipient = '0x456...';

	tx.add(this.balanceManager.withdrawAllFromManager(managerKey, coinKey, recipient));
};
```

### Mint and use capabilities

```tsx
// Example: Mint a TradeCap and use it
mintAndUseTradeCap = async (tx: Transaction) => {
	const managerKey = 'MANAGER_1';

	// Mint the TradeCap
	const tradeCap = tx.add(this.balanceManager.mintTradeCap(managerKey));

	// Transfer to a trader
	const traderAddress = '0x789...';
	tx.transferObjects([tradeCap], traderAddress);
};

// Example: Use DepositCap to deposit funds
depositWithCapability = (tx: Transaction) => {
	const managerKey = 'MANAGER_1';
	const coinKey = 'DBUSDC';
	const amount = 5000; // 5000 USDC

	tx.add(this.balanceManager.depositWithCap(managerKey, coinKey, amount));
};

// Example: Use WithdrawCap to withdraw funds
withdrawWithCapability = (tx: Transaction) => {
	const managerKey = 'MANAGER_1';
	const coinKey = 'SUI';
	const amount = 50; // 50 SUI

	const withdrawnCoin = tx.add(this.balanceManager.withdrawWithCap(managerKey, coinKey, amount));

	// Transfer the withdrawn coin
	tx.transferObjects([withdrawnCoin], '0xabc...');
};
```

### Generate trade proofs

```tsx
// Example: Generate a trade proof and use it to place an order
placeOrderWithProof = (tx: Transaction) => {
	const managerKey = 'MANAGER_1';
	const poolKey = 'SUI_DBUSDC';

	// Generate proof automatically (uses owner or tradeCap method)
	const proof = tx.add(this.balanceManager.generateProof(managerKey));

	// Use the proof to place an order
	tx.add(
		this.deepBook.placeLimitOrder({
			poolKey: poolKey,
			balanceManagerKey: managerKey,
			clientOrderId: '12345',
			price: 2.5,
			quantity: 100,
			isBid: true,
			payWithDeep: true,
		}),
	);
};
```

### Set and manage referrals

```tsx
// Example: Set a pool-specific referral for a balance manager
setManagerReferral = (tx: Transaction) => {
	const managerKey = 'MANAGER_1';
	const referralId = '0xdef...'; // DeepBookPoolReferral ID

	// Get or create the TradeCap
	const tradeCap = tx.object('0x...'); // Assuming tradeCap is already minted

	tx.add(this.balanceManager.setBalanceManagerReferral(managerKey, referralId, tradeCap));
};

// Example: Unset a referral for a specific pool
unsetManagerReferral = (tx: Transaction) => {
	const managerKey = 'MANAGER_1';
	const poolKey = 'SUI_DBUSDC';
	const tradeCap = tx.object('0x...');

	tx.add(this.balanceManager.unsetBalanceManagerReferral(managerKey, poolKey, tradeCap));
};
```

### Complete workflow

```tsx
// Example: Complete balance manager setup workflow
completeSetup = async (tx: Transaction) => {
	const ownerAddress = '0x123...';

	// Step 1: Create manager with custom owner
	const manager = tx.add(this.balanceManager.createBalanceManagerWithOwner(ownerAddress));

	// Step 2: Share the manager
	tx.add(this.balanceManager.shareBalanceManager(manager));

	// Step 3: Mint capabilities
	const tradeCap = tx.add(this.balanceManager.mintTradeCap('MANAGER_1'));
	const depositCap = tx.add(this.balanceManager.mintDepositCap('MANAGER_1'));
	const withdrawCap = tx.add(this.balanceManager.mintWithdrawalCap('MANAGER_1'));

	// Step 4: Transfer capabilities to owner
	tx.transferObjects([depositCap, withdrawCap, tradeCap], ownerAddress);
};
```

# Pools SDK

URL: https://docs.sui.io/onchain-finance/deepbookv3-sdk/pools

Pools are shared objects that represent a market. See [Query the Pool](/onchain-finance/deepbookv3/contract-information/query-the-pool) for more information on pools.

## Pool functions

The DeepBookV3 SDK exposes functions that you can call to read the state of a pool. These functions typically require a `managerKey` , `coinKey` , `poolKey` , or a combination of these. For details on these keys, see [DeepBookV3 SDK](/onchain-finance/deepbookv3-sdk#keys) . The SDK includes some default keys that you can view in the `constants.ts` file.

SDK unit handling
Input amounts, quantities, and prices should be provided in standard decimal format (such as `10.5` SUI or `0.00001` nBTC). The SDK handles conversion to base units internally. Returned amounts are also in standard decimal format.

### account

Use `account` to retrieve the account information for a `BalanceManager` in a pool, which has the following form:

```ts
{
  epoch: '511',
  open_orders: {
    constants: [
      '170141211130585342296014727715884105730',
      '18446744092156295689709543266',
      '18446744092156295689709543265'
    ]
  },
  taker_volume: 0,
  maker_volume: 0,
  active_stake: 0,
  inactive_stake: 0,
  created_proposal: false,
  voted_proposal: null,
  unclaimed_rebates: { base: 0, quote: 0, deep: 0 },
  settled_balances: { base: 0, quote: 0, deep: 0 },
  owed_balances: { base: 0, quote: 0, deep: 0 }
}
```

**Parameters**

- `poolKey` : String that identifies the pool to query.
- `balanceManagerKey` : key of the balance manager defined in the SDK.
Loadingâ€¦

### accountOpenOrders

Use `accountOpenOrders` to retrieve open orders for the balance manager and pool with the IDs you provide. The call returns a `Promise` that contains an array of open order IDs.

**Parameters**

- `poolKey` : String that identifies the pool to query.
- `managerKey` : String that identifies the balance manager to query.
Loadingâ€¦

### checkManagerBalance

Use `checkManagerBalance` to check the balance manager for a specific coin. The call returns a `Promise` in the form:

```text
{
  coinType: string,
  balance: number
}
```

**Parameters**

- `managerKey` : String that identifies the balance manager to query.
- `coinKey` : String that identifies the coin to query the balance of.
Loadingâ€¦

### getOrder

Use `getOrder` to retrieve an order's information. The call returns a `Promise` in the `Order` struct, which has the following form:

```ts
{
  balance_manager_id: {
    bytes: '0x6149bfe6808f0d6a9db1c766552b7ae1df477f5885493436214ed4228e842393'
  },
  order_id: '9223372036873222552073709551614',
  client_order_id: '888',
  quantity: '50000000',
  filled_quantity: '0',
  fee_is_deep: true,
  order_deep_price: { asset_is_base: false, deep_per_asset: '0' },
  epoch: '440',
  status: 0,
  expire_timestamp: '1844674407370955161'
}
```

**Parameters**

`poolKey` : String that identifies the pool to query. `orderId` : ID of the order to query.

Loadingâ€¦

### getQuoteQuantityOut

Use `getQuoteQuantityOut` to retrieve the quote quantity out for the base quantity you provide. The call returns a `Promise` in the form:

```text
{
  baseQuantity: number,
  baseOut: number,
  quoteOut: number,
  deepRequired: number
}
```

where `deepRequired` is the amount of DEEP required for the dry run.

**Parameters**

- `poolKey` : String that identifies the pool to query.
- `baseQuantity` : Number that defines the base quantity you want to convert.
Loadingâ€¦

### getBaseQuantityOut

Use `getBaseQuantityOut` to retrieve the base quantity out for the quote quantity that you provide. The call returns a `Promise` in the form:

```text
{
  quoteQuantity: number,
  baseOut: number,
  quoteOut: number,
  deepRequired: number
}
```

where `deepRequired` is the amount of DEEP required for the dry run.

**Parameters**

- `poolKey` : String that identifies the pool to query.
- `quoteQuantity` : Number that defines the quote quantity you want to convert.
Loadingâ€¦

### getQuantityOut

Use `getQuantityOut` to retrieve the output quantities for the base or quote quantity you provide. You provide values for both quantities, but only one of them can be nonzero. The call returns a `Promise` with the form:

```text
{
  baseQuantity: number,
  quoteQuantity: number,
  baseOut: number,
  quoteOut: number,
  deepRequired: number
}
```

where `deepRequired` is the amount of DEEP required for the dry run.

**Parameters**

- `poolKey` : String that identifies the pool to query.
- `baseQuantity` : Number that defines the base quantity you want to convert. Set to `0` if using quote quantity.
- `quoteQuantity` : Number that defines the quote quantity you want to convert. Set to `0` if using base quantity.
Loadingâ€¦

### getLevel2Range

Use `getLevel2Range` to retrieve level 2 order book within the boundary price range you provide. The call returns a `Promise` in the form:

```text
{
  prices: Array<number>,
  quantities: Array<number>
}
```

**Parameters**

- `poolKey` : String that identifies the pool to query.
- `priceLow` : Number for lower bound of price range.
- `priceHigh` : Number for upper bound of price range.
- `isBid` : Boolean when set to `true` gets bid orders, else retrieve ask orders.
Loadingâ€¦

### getLevel2TicksFromMid

Use `getLevel2TicksFromMid` to retrieve level 2 order book ticks from mid-price for a pool with the ID you provide. The call returns a `Promise` in the form:

```ts
{
  bid_prices: Array<number>,
  bid_quantities: Array<number>,
  ask_prices: Array<number>,
  ask_quantities: Array<number>
}
```

**Parameters**

- `poolKey` : String that identifies the pool to query.
- `ticks` : Number of ticks from mid-price.
Loadingâ€¦

### lockedBalance

Use `lockedBalance` to retrieve a `BalanceManager` locked balance in the pool. The call returns a `Promise` in the `Order` struct, which has the following form:

```ts
{
  base: 5.5,
	quote: 2,
	deep: 0.15,
}
```

**Parameters**

`poolKey` : String that identifies the pool to query. `balanceManagerKey` : key of the balance manager defined in the SDK.

Loadingâ€¦

### poolTradeParams

Use `poolTradeParams` to retrieve the trade params for the pool, which has the following form:

```ts
{
  takerFee: 0.001,
	makerFee: 0.0005,
	stakeRequired: 100,
}
```

**Parameters**

- `poolKey` : String that identifies the pool to query.
Loadingâ€¦

### vaultBalances

Use `vaultBalances` to get the vault balances for a pool with the ID you provide. The call returns a `Promise` in the form:

```ts
{
  base: number,
  quote: number,
  deep: number
}
```

**Parameters**

- `poolKey` : String that identifies the pool to query.
Loadingâ€¦

### getPoolIdByAssets

Use `getPoolIdByAssets` to retrieve the pool ID for the asset types you provide. The call returns a `Promise` with theaddress **Address** A unique, anonymous identity on a blockchain network. of the pool if it's found.

**Parameters**

- `baseType` : String of the type of base asset.
- `quoteType` : String of the type of quote asset.
Loadingâ€¦

### midPrice

Use `midPrice` to retrieve the mid price for a pool with the ID that you provide. The call returns a `Promise` with the mid price.

**Parameters**

- `poolKey` : String that identifies the pool to query.
Loadingâ€¦

### `whitelisted`

Use `whitelisted` to check if the pool with the ID you provide is whitelisted. The call returns a `Promise` as a boolean indicating whether the pool is whitelisted.

**Parameters**

- `poolKey` : String that identifies the pool to query.
Loadingâ€¦

### `poolBookParams`

Use `poolBookParams` to retrieve the book parameters for a pool, including tick size, lot size, and min size. The call returns a `Promise` with the book parameters.

**Parameters**

- `poolKey` : String that identifies the pool to query.
Loadingâ€¦

### `getOrders`

Use `getOrders` to retrieve multiple orders from a pool. The call returns a `Promise` with an array of order information.

**Parameters**

- `poolKey` : String that identifies the pool to query.
- `orderIds` : Array of strings representing the order IDs to retrieve.
Loadingâ€¦

### `getPoolDeepPrice`

Use `getPoolDeepPrice` to get the DEEP price conversion for a pool. The call returns a `Promise` with the DEEP price information.

**Parameters**

- `poolKey` : String that identifies the pool to query.
Loadingâ€¦

## Administrative functions

The SDK provides administrative functions for pool management.

### `addDeepPricePoint`

Use `addDeepPricePoint` to add a DEEP price point for a target pool using a reference pool. The call returns a function that takes a `Transaction`object **Object** The basic unit of storage on Sui. .

**Parameters**

- `targetPoolKey` : String that identifies the target pool.
- `referencePoolKey` : String that identifies the reference pool.
Loadingâ€¦

### `updatePoolAllowedVersions`

Use `updatePoolAllowedVersions` to update the allowedpackage **Package** Smart contracts on Sui. versions for a pool. The call returns a function that takes a `Transaction`object .

**Parameters**

- `poolKey` : String that identifies the pool.
Loadingâ€¦

### `createPermissionlessPool`

Use `createPermissionlessPool` to create a new permissionless pool. The call returns a function that takes a `Transaction`object .

**Parameters**

- `params` : `CreatePermissionlessPoolParams`object containing:
- `baseCoinKey` : String that identifies the base coin.
- `quoteCoinKey` : String that identifies the quote coin.
- `tickSize` : Number representing the tick size.
- `lotSize` : Number representing the lot size.
- `minSize` : Number representing the minimum order size.
- `deepCoin` : Optional `TransactionArgument` for DEEP token payment.
Loadingâ€¦

### `getBalanceManagerIds`

Use `getBalanceManagerIds` to get all balance manager IDs for a specific owner. The call returns a `Promise` with an array of balance manager IDs.

**Parameters**

- `owner` : String representing the owneraddress .
Loadingâ€¦

## Referral functions

The SDK provides functions to manage referrals and earn referral fees from trading activity.

### `mintReferral`

Use `mintReferral` to create a new referral for a pool with a specified multiplier. The multiplier determines what percentage of trading fees are allocated to the referrer. The call returns a function that takes a `Transaction`object .

**Parameters**

- `poolKey` : String that identifies the pool.
- `multiplier` : Number representing the referral multiplier (such as 0.1 for 10%).
Loadingâ€¦

### `updateReferralMultiplier`

Use `updateReferralMultiplier` to update the multiplier for an existing referral. Only the referral owner can update the multiplier. The call returns a function that takes a `Transaction`object .

**Parameters**

- `poolKey` : String that identifies the pool.
- `referral` : String representing the referral ID.
- `multiplier` : Number representing the new referral multiplier.
Loadingâ€¦

### `claimReferralRewards`

Use `claimReferralRewards` to claim accumulated referral fees. Returns anobject with `baseRewards` , `quoteRewards` , and `deepRewards` . The call returns a function that takes a `Transaction`object .

**Parameters**

- `poolKey` : String that identifies the pool.
- `referral` : String representing the referral ID.
Loadingâ€¦

### `getReferralBalances`

Use `getReferralBalances` to view the current accumulated balances for a referral without claiming them. The call returns a `Promise` with the balances in base, quote, and DEEP tokens.

**Parameters**

- `poolKey` : String that identifies the pool.
- `referral` : String representing the referral ID.
Loadingâ€¦

# Orders SDK

URL: https://docs.sui.io/onchain-finance/deepbookv3-sdk/orders

Placing orders is a main function of anyDeepBook **DeepBook** A decentralized central limit order book (CLOB) built on Sui. integration. Before you can place orders, though, you must first set up a balance manager. See [DeepBookV3 SDK](/onchain-finance/deepbookv3-sdk) for information on setting up a balance manager.

## Order functions

The DeepBookV3 SDK provides the following functions for leveraging orders against pools.

### placeLimitOrder

Use `placeLimitOrder` to place limit orders. The call returns a function that takes a `Transaction`object **Object** The basic unit of storage on Sui. .

**Parameters**

- `params` : `SwapParams`object that represents the parameters for the swap.
Loadingâ€¦

### placeMarketOrder

Use `placeMarketOrder` to place market orders. The call returns a function that takes a `Transaction`object .

**Parameters**

- `params` : `SwapParams`object that represents the parameters for the swap.
Loadingâ€¦

### cancelOrder

Use `cancelOrder` to cancel an existing order that is identified by the `orderId` that you provide. The call returns a function that takes a `Transaction`object .

warning
The `orderId` is the protocol `orderId` generated during order placement, which is different from the client `orderId` .

**Parameters**

- `poolKey` : String that identifies the pool from which to borrow.
- `balanceManagerKey` : String that identifies the `BalanceManager` .
- `orderId` : String of the protocol order ID that identifies the order to cancel.
Loadingâ€¦

### cancelOrders

Use `cancelOrders` to cancel multiple orders atomically by providing an array of order IDs. The call returns a function that takes a `Transaction`object .

**Parameters**

- `poolKey` : String that identifies the pool.
- `balanceManagerKey` : String that identifies the `BalanceManager` .
- `orderIds` : Array of strings representing the protocol order IDs to cancel.
Loadingâ€¦

### cancelAllOrders

Use `cancelAllOrders` to cancel every order for the balance manager whose key you provide. The call returns a function that takes a `Transaction`object .

**Parameters**

- `poolKey` : String that identifies the pool from which to borrow.
- `balanceManagerKey` : String that identifies the `BalanceManager` .
Loadingâ€¦

### `modifyOrder`

Use `modifyOrder` to modify an existing order by changing its quantity. The new quantity must be less than the original quantity and more than the filled quantity. The call returns a function that takes a `Transaction`object .

**Parameters**

- `poolKey` : String that identifies the pool.
- `balanceManagerKey` : String that identifies the `BalanceManager` .
- `orderId` : String of the protocol order ID to modify.
- `newQuantity` : Number representing the new quantity for the order.
Loadingâ€¦

### `withdrawSettledAmounts`

Use `withdrawSettledAmounts` to withdraw all settled amounts for a balance manager in a specific pool. The call returns a function that takes a `Transaction`object .

**Parameters**

- `poolKey` : String that identifies the pool.
- `balanceManagerKey` : String that identifies the `BalanceManager` .
Loadingâ€¦

### `withdrawSettledAmountsPermissionless`

Use `withdrawSettledAmountsPermissionless` to withdraw settled amounts permissionlessly for any balance manager. This can be called by anyone and does not require a trade proof. The call returns a function that takes a `Transaction`object .

**Parameters**

- `poolKey` : String that identifies the pool.
- `balanceManagerKey` : String that identifies the `BalanceManager` .
Loadingâ€¦

## Examples

The following examples demonstrate some custom functions for DeepBookV3 orders.

### Limit orders

See the [Order API](/onchain-finance/deepbookv3/contract-information/orders) for the different order types and self matching options.

```tsx
// Params for limit order
interface PlaceLimitOrderParams {
	poolKey: string;
	balanceManagerKey: string;
	clientOrderId: string;
	price: number;
	quantity: number;
	isBid: boolean;
	expiration?: number | bigint; // Default no expiration
	orderType?: OrderType; // Default no restrictions
	selfMatchingOption?: SelfMatchingOptions; // Default self matching allowed
	payWithDeep?: boolean; // Default true
}

/**
 * @description Place a limit order
 * @param {PlaceLimitOrderParams} params Parameters for placing a limit order
 * @returns A function that takes a Transaction object
 */
placeLimitOrder = (params: PlaceLimitOrderParams) => (tx: Transaction) => {};

// Example usage in DeepBookMarketMaker class
// Place a bid of 10 DEEP at $0.1
customPlaceLimitOrder = (tx: Transaction) => {
	const poolKey = 'DEEP_DBUSDC'; // Pool key, check constants.ts for more
	const managerKey = 'MANAGER_1'; // Balance manager key, initialized during client creation by user
	tx.add(
		this.deepBook.placeLimitOrder({
			poolKey: poolKey,
			balanceManagerKey: managerKey,
			clientOrderId: '1',
			price: 0.1,
			quantity: 10,
			isBid: true,
			payWithDeep: true,
		}),
	);
};
```

### Place market order

Example of placing a market order.

```tsx
// Params for market order
interface PlaceMarketOrderParams {
	poolKey: string;
	balanceManagerKey: string;
	clientOrderId: string;
	quantity: number;
	isBid: boolean;
	selfMatchingOption?: SelfMatchingOptions;
	payWithDeep?: boolean;
}

// Example usage in DeepBookMarketMaker class
// Place a market sell of 10 SUI in the SUI_DBUSDC pool
customPlaceMarketOrder = (tx: Transaction) => {
	const poolKey = 'SUI_DBUSDC'; // Pool key, check constants.ts for more
	const managerKey = 'MANAGER_1'; // Balance manager key, initialized during client creation by user
	tx.add(
		this.deepBook.placeMarketOrder({
			poolKey: poolKey,
			balanceManagerKey: managerKey,
			clientOrderId: '2',
			quantity: 10,
			isBid: true,
			payWithDeep: true,
		}),
	);
};
```

### Cancel an order

Example of canceling a single order in a pool for a balance manager.

```tsx
/**
 * @description Cancel an existing order
 * @param {string} poolKey The key to identify the pool
 * @param {string} balanceManagerKey The key to identify the BalanceManager
 * @param {number} orderId Order ID to cancel
 * @returns A function that takes a Transaction object
 */
cancelOrder =
	(poolKey: string, balanceManagerKey: string, orderId: number) => (tx: Transaction) => {};

// Example usage in DeepBookMarketMaker class
// Cancel order 12345678 in SUI_DBUSDC pool
cancelOrder = (tx: Transaction) => {
	const poolKey = 'SUI_DBUSDC'; // Pool key, check constants.ts for more
	const managerKey = 'MANAGER_1'; // Balance manager key, initialized during client creation by user
	tx.add(this.deepBook.cancelOrder(poolKey, managerKey, 12345678));
};
```

### Cancel all orders

Example of canceling all orders in a pool for a balance manager.

```tsx
/**
 * @description Cancel all open orders for a balance manager
 * @param {string} poolKey The key to identify the pool
 * @param {string} balanceManagerKey The key to identify the BalanceManager
 * @returns A function that takes a Transaction object
 */
cancelAllOrders = (poolKey: string, balanceManagerKey: string) => (tx: Transaction) => {};

// Example usage in DeepBookMarketMaker class
// Cancel order 12345678 in SUI_DBUSDC pool
cancelOrder = (tx: Transaction) => {
	const poolKey = 'SUI_DBUSDC'; // Pool key, check constants.ts for more
	const managerKey = 'MANAGER_1'; // Balance manager key, initialized during client creation by user
	tx.add(this.deepBook.cancelAllOrders(poolKey, managerKey));
};
```
# Flash Loans SDK

URL: https://docs.sui.io/onchain-finance/deepbookv3-sdk/flash-loans

A flash loan is one where the borrowing and returning of loans from pools is performed within a single programmabletransaction **Transaction** A number of commands that execute on inputs to define the result of the transaction. block. The SDK exposes functions that allow you to implement this functionality. See [Flash Loans](/onchain-finance/deepbookv3/contract-information/flash-loans) for more details on the API.

## Flash loan functions

The DeepBookV3 SDK provides the following flash loan related functions.

### borrowBaseAsset

Use `borrowBaseAsset` to borrow a base asset from the pool identified by the `poolKey` value you provide. The call returns a function that takes a `Transaction`object **Object** The basic unit of storage on Sui.

**Parameters**

- `poolKey` : String that identifies the pool from which to borrow.
- `borrowAmount` : Number that represents the amount to borrow from the pool.

```tsx
borrowBaseAsset(poolKey: string, borrowAmount: number);
```

### returnBaseAsset

Use `returnBaseAsset` to return the base asset to the pool identified by the `poolKey` value you provide. The call returns a function that takes a `Transaction`object .

**Parameters**

- `poolKey` : String that identifies the pool from which to borrow.
- `borrowAmount` : Number that represents the amount to borrow from the pool.
- `baseCoinInput` : Coinobject representing the base asset to be returned.
- `flashLoan` : Flash loanobject representing the loan to be settled.

```tsx
returnBaseAsset(
  {
    poolKey: string,
    borrowAmount: number,
    baseCoinInput: TransactionObjectArgument,
    flashLoan: TransactionObjectArgument,
  }
)
```

### borrowQuoteAsset

Use `borrowQuoteAsset` to borrow a quote asset from the pool identified by the `poolKey` value you provide. The call returns a function that takes a `Transaction`object .

**Parameters**

- `poolKey` : String that identifies the pool from which to borrow.
- `borrowAmount` : Number that represents the amount to borrow from the pool.

```tsx
borrowQuoteAsset(poolKey: string, borrowAmount: number);
```

### returnQuoteAsset

Use `returnQuoteAsset` to return a quote asset to the pool identified by the `poolKey` you provide. The call returns a function that takes a `Transaction`object .

**Parameters**

- `poolKey` : String that identifies the pool from which to borrow.
- `borrowAmount` : Number that represents the amount to borrow from the pool.
- `baseCoinInput` : Coinobject representing the quote asset to be returned.
- `flashLoan` : Flash loanobject representing the loan to be settled.

```tsx
returnQuoteAsset(
  poolKey: string,
  borrowAmount: number,
  quoteCoinInput: TransactionObjectArgument,
  flashLoan: TransactionObjectArgument,
);
```

## Flash loan example

The following example demonstrates flash loan usage in `DeepBookMarketMaker` class.

```tsx
// Example of a flash loan transaction
// Borrow 1 DEEP from DEEP_SUI pool
// Swap 0.5 DBUSDC for SUI in SUI_DBUSDC pool, pay with deep borrowed
// Swap SUI back to DEEP
// Return 1 DEEP to DEEP_SUI pool
flashLoanExample = async (tx: Transaction) => {
  const borrowAmount = 1;
  const [deepCoin, flashLoan] = tx.add(this.flashLoans.borrowBaseAsset('DEEP_SUI', borrowAmount));

  // Execute trade using borrowed DEEP
  const [baseOut, quoteOut, deepOut] = tx.add(
    this.deepBook.swapExactQuoteForBase({
      poolKey: 'SUI_DBUSDC',
      amount: 0.5,
      deepAmount: 1,
      minOut: 0,
      deepCoin: deepCoin,
    }),
  );

  tx.transferObjects([baseOut, quoteOut, deepOut], this.getActiveAddress());

  // Execute second trade to get back DEEP for repayment
  const [baseOut2, quoteOut2, deepOut2] = tx.add(
    this.deepBook.swapExactQuoteForBase({
      poolKey: 'DEEP_SUI',
      amount: 10,
      deepAmount: 0,
      minOut: 0,
    }),
  );

  tx.transferObjects([quoteOut2, deepOut2], this.getActiveAddress());

  // Return borrowed DEEP
  const loanRemain = tx.add(
    this.flashLoans.returnBaseAsset('DEEP_SUI', borrowAmount, baseOut2, flashLoan),
  );
  
  // Send the remaining coin to user's address
  tx.transferObjects([loanRemain], this.getActiveAddress());
};
```

# Swaps

URL: https://docs.sui.io/onchain-finance/deepbookv3-sdk/swaps

DeepBookV3 provides a swap-like interface commonly seen in automatic market makers (AMMs). The DeepBookV3 SDK provides functions to leverage the features of this interface. See [Swaps](/onchain-finance/deepbookv3/contract-information/swaps) in the API section for more details.

## Swap functions

The SDK provides the following functions to perform swaps between the base and quote asset.

### swapExactBaseForQuote

Use `swapExactBaseForQuote` to swap exact base amount for quote amount. The call returns a function that takes a `Transaction`object **Object** The basic unit of storage on Sui. .

**Parameters**

- `params` : `SwapParams`object that represents the parameters for the swap.

```tsx
swapExactBaseForQuote({ params: SwapParams });
```

### swapExactQuoteForBase

Use `swapExactQuoteForBase` to swap exact quote amount for base amount. The call returns a function that takes a `Transaction`object .

**Parameters**

- `params` : `SwapParams`object that represents the parameters for the swap.

```tsx
swapExactQuoteForBase({ params: SwapParams });
```

### `swapExactQuantity`

Use `swapExactQuantity` to swap an exact quantity in either direction (base to quote or quote to base) without using a balance manager. The call returns a function that takes a `Transaction`object .

**Parameters**

- `params` : `SwapParams & { isBaseToCoin: boolean }`object containing:
- `poolKey` : String that identifies the pool.
- `amount` : Number representing the amount to swap.
- `deepAmount` : Number representing the DEEP amount for fees.
- `minOut` : Number representing minimum output amount.
- `isBaseToCoin` : Boolean indicating swap direction (true = base to quote).
- `baseCoin` : Optional `TransactionArgument` for base coin input.
- `quoteCoin` : Optional `TransactionArgument` for quote coin input.
- `deepCoin` : Optional `TransactionArgument` for DEEP coin input.
Loadingâ€¦

### swapExactQuantityWithManager

Use `swapExactQuantityWithManager` to swap an exact quantity using a balance manager. The call returns a function that takes a `Transaction`object .

**Parameters**

- `params` : `SwapWithManagerParams & { isBaseToCoin: boolean }`object containing:
- `poolKey` : String that identifies the pool.
- `balanceManagerKey` : String that identifies the balance manager.
- `amount` : Number representing the amount to swap.
- `minOut` : Number representing minimum output amount.
- `isBaseToCoin` : Boolean indicating swap direction (true = base to quote).
- `tradeCap` : Optional `TransactionArgument` for trade capability.
- `depositCap` : Optional `TransactionArgument` for deposit capability.
- `withdrawCap` : Optional `TransactionArgument` for withdraw capability.
- `baseCoin` : Optional `TransactionArgument` for base coin input.
- `quoteCoin` : Optional `TransactionArgument` for quote coin input.
Loadingâ€¦

### Examples

The following examples demonstrate custom swap functions that you can place into the `DeepBookMarketMaker` class. Base coin, quote coin, and deep coin are automatically determined by the coin available in the useraddress **Address** A unique, anonymous identity on a blockchain network. unless you explicitly pass one in as an argument. You cantransfer **Transfer** Changing the owner of an asset. the coin outputs to theiraddress or execute other operations using the outputs.

```tsx
swapExactBaseForQuote = (tx: Transaction) => {
  const [baseOut, quoteOut, deepOut] = this.deepBook.swapExactBaseForQuote({
    poolKey: 'SUI_DBUSDC',
    amount: 1, // amount of SUI to swap
    deepAmount: 1, // amount of DEEP to pay as fees, excess is returned
    minOut: 0.1, // minimum amount of DBUSDC to receive or transaction fails
  })(tx);

  // Transfer received coins to own address
  tx.transferObjects([baseOut, quoteOut, deepOut], this.getActiveAddress());
};

swapExactQuoteForBase = (tx: Transaction) => {
  const [baseOut, quoteOut, deepOut] = this.deepBook.swapExactQuoteForBase({
    poolKey: 'SUI_DBUSDC',
    amount: 1, // amount of DBUSDC to swap
    deepAmount: 1, // amount of DEEP to pay as fees, excess is returned
    minOut: 0.1, // minimum amount of SUI to receive or transaction fails
  })(tx);

  // Transfer received coins to own address
  tx.transferObjects([baseOut, quoteOut, deepOut], this.getActiveAddress());
};
```
# Staking and Governance SDK

URL: https://docs.sui.io/onchain-finance/deepbookv3-sdk/staking-governance

Examples of interacting with staking and governance. These functions typically require a `balanceManagerKey` , `poolKey` , or both. For details on these keys, see [DeepBookV3 SDK](/onchain-finance/deepbookv3-sdk#keys) . The SDK includes some default keys that you can view in the `constants.ts` file.

See [Staking and Governance](/onchain-finance/deepbookv3/contract-information/staking-governance) for more information on the staking and governance API.

## Staking and governance functions

### stake

Use `stake` to stake an amount you specify into a specific pool. The call returns a `Transaction`object **Object** The basic unit of storage on Sui. .

**Parameters**

- `poolKey` : String that identifies the pool.
- `balanceManagerKey` : String that identifies the balance manager.
- `stakeAmount` : Number representing the amount to stake.

```tsx
stake(poolKey: string, balanceManagerKey: string, stakeAmount: number);
```

### unstake

Use `unstake` to unstake from a particular pool. The call returns a `Transaction`object .

**Parameters**

- `poolKey` : String that identifies the pool.
- `balanceManagerKey` : String that identifies the balance manager.

```tsx
unstake(poolKey: string, balanceManagerKey: string);
```

### submitProposal

Use `submitProposal` to submit a governance proposal. The call returns a `Transaction`object .

**Parameters**

- `params` : A `ProposalParams`object that defines the proposal.

```tsx
submitProposal({ params: ProposalParams });
```

### vote

Use `vote` to vote on a proposal. The call returns a `Transaction`object .

**Parameters**

- `poolKey` : String that identifies the pool.
- `balanceManagerKey` : String that identifies the balance manager.
- `proposal_id` : String that identifies the proposal to vote on.

```tsx
vote(poolKey: string, balanceManagerKey: string, proposal_id: string)
```

### `claimRebates`

Use `claimRebates` to claim maker/taker rebates for a balance manager in a specific pool. The call returns a function that takes a `Transaction`object .

**Parameters**

- `poolKey` : String that identifies the pool.
- `balanceManagerKey` : String that identifies the balance manager.
Loadingâ€¦

## Examples

The following examples demonstrate custom staking and governance functions that you can place into the `DeepBookMarketMaker` class.

### stake custom function

```tsx
stake = (
  poolKey: string, 
  balanceManagerKey: string, 
  stakeAmount: number
) => (tx: Transaction) => {}

// Custom function to stake 100 DEEP in DeepBookMarketMaker class
stake = (tx: Transaction) => {
  const poolKey = 'DBUSDT_DBUSDC';
  const balanceManagerKey = 'MANAGER_1';
  tx.add(this.governance.stake(poolKey, balanceManagerKey, 100));
};
```

### unstake custom function

```tsx
unstake = (
  poolKey: string, 
  balanceManagerKey: string
) => (tx: Transaction) => {}

// Custom function to unstake in DeepBookMarketMaker class
unstake = (tx: Transaction) => {
  const poolKey = 'DBUSDT_DBUSDC';
  const balanceManagerKey = 'MANAGER_1';
  tx.add(this.governance.unstake(poolKey, balanceManagerKey));
};
```

### submitProposal custom function

```tsx
// Proposal params
export interface ProposalParams {
  poolKey: string;
  balanceManagerKey: string;
  takerFee: number;
  makerFee: number;
  stakeRequired: number;
}

submitProposal = (params: ProposalParams) => (tx: Transaction) => {}

// Custom function to submit proposal in DeepBookMarketMaker class
submitProposal = (tx: Transaction) => {
  const poolKey = 'DBUSDT_DBUSDC';
  const balanceManagerKey = 'MANAGER_1';
  tx.add(
    this.governance.submitProposal({
      poolKey,
      balanceManagerKey,
      takerFee: 0.002,
      makerFee: 0.001,
      stakeRequired: 100,
    }),
  );
};
```

### vote custom function

```tsx
vote = (
  poolKey: string, 
  balanceManagerKey: string, 
  proposal_id: string
) => (tx: Transaction) => {}

// Custom function to vote in DeepBookMarketMaker class
vote = (tx: Transaction) => {
  const poolKey = 'DBUSDT_DBUSDC';
  const balanceManagerKey = 'MANAGER_1';
  const proposalID = '0x123456789';
  tx.add(this.governance.vote(poolKey, balanceManagerKey, proposalID));
};
```

The V3 SDK is enough because it includes staking, the swap, flash loans, orders, pools, and the balance manager. So yeah, I would say go for it, man. Something I want to have really bad, not gonna lie.

You can say AI agents can be able to place orders. You can even do flash loans and everything without having to just tell it, and you sign a transaction—we add it to our MCP too. But this is not a lot of work, so it's not really a lot of work since we have the SDK already.

Yes, the SDK, the thing they gave us, the SDK repository, the SDK version, and everything is even open source. It will make our work fucking easier. I'm thinking of running it though, not gonna lie. It's real good. You can just do a different workaround. Nine agents will virtually take care of this. Something like I can spin up a worktree for myself or a workflow, sorry. 

