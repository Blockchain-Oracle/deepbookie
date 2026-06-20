# DeepBook V3 — Full Tool Surface (Spot + Margin)

_Generated from the official `@mysten/deepbook-v3` SDK source (v1.5.1). All amounts human-readable floats; identifiers are config KEYS, not raw addresses._

## Spot (CLOB)

Complete DeepBook V3 SPOT (CLOB) tool surface as exposed by the official @mysten/deepbook-v3 SDK. The SDK is organized as a DeepBookClient with sub-namespace contract objects: balanceManager (BalanceManagerContract), deepBook (DeepBookContract), flashLoans (FlashLoanContract), governance (GovernanceContract), deepBookAdmin (DeepBookAdminContract). There are two distinct calling styles: (1) the DeepBookClient async read methods (e.g. client.midPrice(poolKey)) which internally run devInspectTransactionBlock and parse BCS results -> these are READS, no signing; (2) the contract transaction-builder methods (e.g. client.deepBook.placeLimitOrder(params)) which are CURRIED functions ((params) => (tx: Transaction) => result) that you pass to tx.add(...) and must be signed/executed -> these are WRITES. The same logical operation often exists in both forms (a low-level builder on the contract that mutates a Transaction, and a high-level client async wrapper that devInspects and returns typed JS values). For an agent: READ via the client.* async methods; WRITE by composing contract.* builders into one Transaction and signing it. Pool/coin/manager identifiers are string KEYS resolved from a config registry (DeepBookConfig), not raw addresses. All amounts in client/builder methods are human-readable floats (the SDK applies coin scalars internally). Mainnet pool keys e.g. 'SUI_USDC', 'DEEP_SUI'. The structured 'tools' list below uses the client async read methods for reads and the contract builder methods for writes, since those are the natural MCP tool boundaries.



### Spot · balance-manager

| Tool | Kind | Params | Returns | Purpose |
|---|---|---|---|---|
| `createAndShareBalanceManager` | write-sign | () -> (tx)=>TransactionArgument; no params | BalanceManager object arg; tx creates+shares a new BalanceManager (shared object) | Create and share a new BalanceManager, the per-user custody/account object required for all trading. |
| `depositIntoManager` | write-sign | managerKey:string, coinKey:string, amountToDeposit:number | (tx)=>void; moveCall deposit | Deposit a coin (base/quote/DEEP) into a BalanceManager to fund trading. |
| `withdrawFromManager` | write-sign | managerKey:string, coinKey:string, amountToWithdraw:number, recipient:string | (tx)=>void; moveCall withdraw + transfer to recipient | Withdraw a specified amount of a coin from a BalanceManager to an address. |
| `withdrawAllFromManager` | write-sign | managerKey:string, coinKey:string, recipient:string | (tx)=>void; moveCall withdraw-all + transfer | Withdraw the entire balance of a coin from a BalanceManager. |
| `checkManagerBalance` | read | managerKey:string, coinKey:string  (client async wrapper) | ManagerBalance { coinType:string, balance:number } | Read the current balance of one coin held inside a BalanceManager (devInspect). |
| `getBalanceManagerIds` | read | owner:string | string[] of BalanceManager object IDs | List all BalanceManager object IDs owned by an address. |
| `generateProof` | write-sign | managerKey:string -> (tx)=>TradeProof arg | TransactionArgument (TradeProof hot-potato); auto-picks owner vs trader proof | Generate the TradeProof required by order/trade calls; composed inline within a trading Transaction. |
| `generateProofAsOwner` | write-sign | managerId:string -> (tx)=>TradeProof arg | TransactionArgument (TradeProof) | Generate a TradeProof as the BalanceManager owner. |
| `generateProofAsTrader` | write-sign | managerId:string, tradeCapId:string -> (tx)=>TradeProof arg | TransactionArgument (TradeProof) | Generate a TradeProof using a delegated TradeCap (for non-owner traders). |
| `mintTradeCap` | write-sign | managerKey:string -> (tx)=>TradeCap arg | TransactionArgument (TradeCap object) | Mint a TradeCap delegating trading rights on a BalanceManager to another party. |
| `revokeTradeCap` | write-sign | managerKey:string, tradeCapId:string | (tx)=>void | Revoke a previously minted TradeCap. |

### Spot · orders

| Tool | Kind | Params | Returns | Purpose |
|---|---|---|---|---|
| `placeLimitOrder` | write-sign | PlaceLimitOrderParams { poolKey, balanceManagerKey, clientOrderId:string, price:number\|bigint, quantity:number\|bigint, isBid:boolean, expiration?, orderType?:OrderType, selfMatchingOption?:SelfMatchingOptions, payWithDeep?:boolean } | (tx)=>void; emits OrderInfo on-chain | Place a limit order on a CLOB pool from a BalanceManager. |
| `placeMarketOrder` | write-sign | PlaceMarketOrderParams { poolKey, balanceManagerKey, clientOrderId:string, quantity:number\|bigint, isBid:boolean, selfMatchingOption?, payWithDeep?:boolean } | (tx)=>void | Place an immediate market order (fills against the book) from a BalanceManager. |
| `modifyOrder` | write-sign | poolKey:string, balanceManagerKey:string, orderId:string, newQuantity:number | (tx)=>void | Reduce the quantity of an existing open order (cannot increase). |
| `cancelOrder` | write-sign | poolKey:string, balanceManagerKey:string, orderId:string | (tx)=>void | Cancel a single open order by order ID. |
| `cancelOrders` | write-sign | poolKey:string, balanceManagerKey:string, orderIds:string[] | (tx)=>void | Cancel a specific batch of open orders by ID. |
| `cancelAllOrders` | write-sign | poolKey:string, balanceManagerKey:string | (tx)=>void | Cancel every open order the BalanceManager has in a pool. |
| `withdrawSettledAmounts` | write-sign | poolKey:string, balanceManagerKey:string | (tx)=>void | Settle/withdraw filled proceeds back into the BalanceManager balances. |
| `claimRebates` | write-sign | poolKey:string, balanceManagerKey:string | (tx)=>void | Claim accrued maker/taker fee rebates for a BalanceManager in a pool. |

### Spot · swaps

| Tool | Kind | Params | Returns | Purpose |
|---|---|---|---|---|
| `swapExactBaseForQuote` | write-sign | SwapParams { poolKey, amount, deepAmount, minOut, baseCoin?, deepCoin?, quoteCoin? } | (tx)=>[baseCoinResult, quoteCoinResult, deepCoinResult] | Manager-less swap: sell exact base for quote using raw coins (DEEP fee paid in coin). |
| `swapExactQuoteForBase` | write-sign | SwapParams { poolKey, amount, deepAmount, minOut, baseCoin?, deepCoin?, quoteCoin? } | (tx)=>[baseCoinResult, quoteCoinResult, deepCoinResult] | Manager-less swap: spend exact quote to buy base using raw coins. |
| `swapExactQuantity` | write-sign | SwapParams & { isBaseToCoin:boolean } | (tx)=>[baseCoinResult, quoteCoinResult, deepCoinResult] | Generic manager-less exact-in swap; direction chosen by isBaseToCoin. |
| `swapExactBaseForQuoteWithManager` | write-sign | SwapWithManagerParams { poolKey, balanceManagerKey, tradeCap, depositCap, withdrawCap, amount, minOut, baseCoin? } | (tx)=>[baseCoinResult, quoteCoinResult] | Swap exact base for quote drawing funds from a BalanceManager (cap-authorized). |
| `swapExactQuoteForBaseWithManager` | write-sign | SwapWithManagerParams { poolKey, balanceManagerKey, tradeCap, depositCap, withdrawCap, amount, minOut, quoteCoin? } | (tx)=>[baseCoinResult, quoteCoinResult] | Swap exact quote for base drawing funds from a BalanceManager. |
| `swapExactQuantityWithManager` | write-sign | SwapWithManagerParams & { isBaseToCoin:boolean } | (tx)=>[baseCoinResult, quoteCoinResult] | Generic manager-funded exact-in swap; direction via isBaseToCoin. |

### Spot · flashloan

| Tool | Kind | Params | Returns | Purpose |
|---|---|---|---|---|
| `borrowBaseAsset` | write-sign | poolKey:string, borrowAmount:number | (tx)=>[baseCoinResult, flashLoan]  (FlashLoan is a hot-potato) | Borrow base asset via flash loan; returns coin + FlashLoan receipt that must be returned same tx. |
| `returnBaseAsset` | write-sign | poolKey:string, borrowAmount:number, baseCoinInput:TransactionObjectArgument, flashLoan:TransactionObjectArgument | (tx)=>baseCoinInput (leftover coin) | Repay a base-asset flash loan, consuming the FlashLoan hot-potato. |
| `borrowQuoteAsset` | write-sign | poolKey:string, borrowAmount:number | (tx)=>[quoteCoinResult, flashLoan] | Borrow quote asset via flash loan; returns coin + FlashLoan receipt. |
| `returnQuoteAsset` | write-sign | poolKey:string, borrowAmount:number, quoteCoinInput:TransactionObjectArgument, flashLoan:TransactionObjectArgument | (tx)=>quoteCoinInput (leftover coin) | Repay a quote-asset flash loan, consuming the FlashLoan hot-potato. |

### Spot · governance

| Tool | Kind | Params | Returns | Purpose |
|---|---|---|---|---|
| `stake` | write-sign | poolKey:string, balanceManagerKey:string, stakeAmount:number | (tx)=>void | Stake DEEP from a BalanceManager into a pool to earn fee discounts/governance weight. |
| `unstake` | write-sign | poolKey:string, balanceManagerKey:string | (tx)=>void | Unstake all DEEP staked by a BalanceManager in a pool. |
| `submitProposal` | write-sign | ProposalParams { poolKey, balanceManagerKey, takerFee, makerFee, stakeRequired } | (tx)=>void | Submit a fee/stake governance proposal for a pool (requires staked DEEP). |
| `vote` | write-sign | poolKey:string, balanceManagerKey:string, proposal_id:string | (tx)=>void | Vote on an active governance proposal with staked DEEP weight. |

### Spot · query

| Tool | Kind | Params | Returns | Purpose |
|---|---|---|---|---|
| `midPrice` | read | poolKey:string  (client async) | number (mid price, human units) | Read the current mid price of a pool (devInspect). |
| `poolTradeParams` | read | poolKey:string | PoolTradeParams { takerFee, makerFee, stakeRequired } | Read a pool's current taker/maker fees and stake requirement. |
| `poolBookParams` | read | poolKey:string | PoolBookParams { tickSize, lotSize, minSize } | Read a pool's tick size, lot size, and minimum order size. |
| `getLevel2Range` | read | poolKey:string, priceLow:number\|bigint, priceHigh:number\|bigint, isBid:boolean | Level2Range { prices:number[], quantities:number[] } | Read aggregated order-book depth across a price range on one side. |
| `getLevel2TicksFromMid` | read | poolKey:string, ticks:number | Level2TicksFromMid { bid_prices[], bid_quantities[], ask_prices[], ask_quantities[] } | Read N ticks of book depth on both sides centered on mid price. |
| `getQuoteQuantityOut` | read | poolKey:string, baseQuantity:number\|bigint | QuoteQuantityOut { baseQuantity, baseOut, quoteOut, deepRequired } | Quote: how much quote you get for selling a given base amount (incl. DEEP fee needed). |
| `getBaseQuantityOut` | read | poolKey:string, quoteQuantity:number\|bigint | BaseQuantityOut { quoteQuantity, baseOut, quoteOut, deepRequired } | Quote: how much base you get for spending a given quote amount. |
| `getQuantityOut` | read | poolKey:string, baseQuantity:number\|bigint, quoteQuantity:number\|bigint | QuantityOut { baseQuantity, quoteQuantity, baseOut, quoteOut, deepRequired } | Generic dry-run quote for either swap direction including DEEP fee. |
| `getQuoteQuantityOutInputFee` | read | poolKey:string, baseQuantity:number\|bigint | QuoteQuantityOut (fee paid from input coin, no separate DEEP) | Quote variant where the fee is taken from the input coin (input-coin-fee pools). |
| `getBaseQuantityOutInputFee` | read | poolKey:string, quoteQuantity:number\|bigint | BaseQuantityOut (input-coin fee) | Base-out quote where fee is paid from the input coin. |
| `account` | read | poolKey:string, managerKey:string | AccountInfo { epoch, open_orders, taker_volume, maker_volume, active_stake, inactive_stake, unclaimed_rebates, settled_balances, owed_balances, ... } | Read full per-pool account state for a BalanceManager (volumes, stake, settled/owed balances). |
| `accountOpenOrders` | read | poolKey:string, managerKey:string | string[] of open order IDs | List the IDs of a BalanceManager's currently open orders in a pool. |
| `lockedBalance` | read | poolKey:string, balanceManagerKey:string | LockedBalances { base, quote, deep } | Read balances locked in resting orders for a BalanceManager in a pool. |
| `getOrder` | read | poolKey:string, orderId:string | Order object (price, quantity, filled, isBid, owner, expiration, status) or null | Read the details of a single order by ID. |
| `getOrders` | read | poolKey:string, orderIds:string[] | Order[] details | Batch-read details for multiple orders by ID. |
| `getOrderNormalized` | read | poolKey:string, orderId:string | Normalized order (decoded price/quantity in human units) | Read a single order with decoded, normalized price/quantity fields. |
| `getAccountOrderDetails` | read | poolKey:string, managerKey:string | Array of normalized open order details for the manager | Read full normalized details of all open orders for a BalanceManager in a pool. |
| `vaultBalances` | read | poolKey:string | VaultBalances { base, quote, deep } | Read the pool vault's total base/quote/DEEP balances (pool liquidity). |
| `getPoolIdByAssets` | read | baseType:string, quoteType:string | string pool object ID | Resolve a pool object ID from its base/quote coin type strings. |
| `poolId` | read | poolKey:string | string pool object ID | Resolve a pool object ID from its config key. |
| `whitelisted` | read | poolKey:string | boolean | Check whether a pool is whitelisted (zero-fee / DEEP-less). |
| `getPoolDeepPrice` | read | poolKey:string | PoolDeepPrice { asset_is_base, deep_per_asset / deep_per_base / deep_per_quote } | Read the conversion rate used to price DEEP fees against the pool's assets. |
| `accountExists` | read | poolKey:string, managerKey:string | boolean | Check whether a BalanceManager already has an account opened in a pool. |
| `canPlaceLimitOrder` | read | CanPlaceLimitOrderParams { poolKey, balanceManagerKey, price, quantity, isBid, payWithDeep, expireTimestamp } | boolean | Pre-flight check that a prospective limit order would be accepted. |
| `canPlaceMarketOrder` | read | CanPlaceMarketOrderParams { poolKey, balanceManagerKey, quantity, isBid, payWithDeep } | boolean | Pre-flight check that a prospective market order would be accepted. |
| `getOrderDeepRequired` | read | poolKey:string, baseQuantity:number\|bigint, price:number\|bigint | OrderDeepRequiredResult (deep amount needed) | Compute how much DEEP is required to pay fees for a given order. |

### Spot · admin

| Tool | Kind | Params | Returns | Purpose |
|---|---|---|---|---|
| `createPoolAdmin` | admin | CreatePoolAdminParams { baseCoinKey, quoteCoinKey, tickSize, lotSize, minSize, whitelisted, stablePool } (requires DeepBookAdminCap) | (tx)=>void; creates a new pool | Admin-create a new trading pool (requires admin cap). |
| `unregisterPoolAdmin` | admin | poolKey:string (admin cap) | (tx)=>void | Admin-unregister/remove a pool. |
| `adjustTickSize` | admin | poolKey:string, newTickSize:number (admin cap) | (tx)=>void | Admin-adjust a pool's tick size. |
| `adjustMinLotSize` | admin | poolKey:string, newLotSize:number, newMinSize:number (admin cap) | (tx)=>void | Admin-adjust a pool's lot size and minimum size. |
| `updateAllowedVersions` | admin | poolKey:string (admin cap) | (tx)=>void | Admin-sync a pool's allowed package versions. |
| `enableVersion` | admin | version:number (admin cap) | (tx)=>void | Admin-enable a package version globally. |
| `disableVersion` | admin | version:number (admin cap) | (tx)=>void | Admin-disable a package version globally. |
| `addStableCoin` | admin | stableCoinKey:string (admin cap) | (tx)=>void | Admin-register a coin as stable (enables stable-pool fee tier). |
| `removeStableCoin` | admin | stableCoinKey:string (admin cap) | (tx)=>void | Admin-deregister a stable coin. |
| `setTreasuryAddress` | admin | treasuryAddress:string (admin cap) | (tx)=>void | Admin-set the protocol treasury address. |
| `createPermissionlessPool` | write-sign | CreatePermissionlessPoolParams { baseCoinKey, quoteCoinKey, tickSize, lotSize, minSize, deepCoin? } | (tx)=>void; pays DEEP creation fee | Permissionlessly create a new pool by paying the DEEP creation fee (no admin cap needed). |


**Spot notes:** CALLING-STYLE / SDK SHAPE: @mysten/deepbook-v3 exposes a DeepBookClient(constructor: { client: SuiClient, address, env: 'mainnet'|'testnet', balanceManagers?, coins?, pools? }). Reads are async methods directly on the client (client.midPrice, client.account, client.getQuoteQuantityOut, ...) that internally build a Transaction, run suiClient.devInspectTransactionBlock, and BCS-decode the result -> NO wallet, NO signing, NO gas. Writes are on namespaced contract objects (client.balanceManager.*, client.deepBook.*, client.flashLoans.*, client.governance.*, client.deepBookAdmin.*). Every builder is CURRIED: e.g. client.deepBook.placeLimitOrder(params) returns a fn (tx: Transaction) => void; you call tx.add(client.deepBook.placeLimitOrder(params)) then sign+execute with a Signer. So an MCP 'write' tool must: (a) construct a Transaction, (b) tx.add the builder(s), (c) sign with the agent's keypair, (d) signAndExecuteTransaction. \n\nKEYS NOT ADDRESSES: poolKey, coinKey, balanceManagerKey, stableCoinKey are string keys looked up in DeepBookConfig (built-in mainnet/testnet registries for coins like SUI/USDC/DEEP and pools like SUI_USDC, DEEP_SUI, plus any custom ones you register at construction). amounts/prices are HUMAN floats; the SDK multiplies by coin scalars and pool lot/tick internally. clientOrderId is a caller-chosen string tag.\n\nMOST USEFUL FOR AGENTIC TRADING (priority): READS for decisioning -> midPrice, getLevel2TicksFromMid (book snapshot), getQuoteQuantityOut/getBaseQuantityOut/getQuantityOut (dry-run a fill incl deepRequired), poolBookParams (tick/lot/min for valid sizing), poolTradeParams (fees), checkManagerBalance + account + accountOpenOrders + lockedBalance (position/exposure), canPlaceLimitOrder/canPlaceMarketOrder (pre-flight). WRITES core loop -> createAndShareBalanceManager (once), depositIntoManager, placeLimitOrder / placeMarketOrder, cancelOrder/cancelAllOrders, modifyOrder, withdrawSettledAmounts, withdrawFromManager. For instant in/out without managing resting orders -> swapExactBaseForQuote / swapExactQuoteForBase (manager-less, raw coins). \n\nSEQUENCING CONSTRAINTS (hard): \n1) You MUST have a BalanceManager before any order/stake/trade. Create+share it first (createAndShareBalanceManager) in its own tx, capture the shared object ID, register it as a balanceManagerKey on the client. \n2) Fund it: depositIntoManager (base/quote, and DEEP if payWithDeep and the pool is not whitelisted). \n3) Order/trade calls internally require a TradeProof — the high-level placeLimitOrder/placeMarketOrder/cancel*/stake builders generate the proof for you via balanceManager.generateProof, but if you compose low-level Move calls yourself you must add generateProof(managerKey) -> pass the TradeProof arg. Owner proofs need the owner's signature; delegated traders need a TradeCap (mintTradeCap) and use generateProofAsTrader. \n4) FLASH LOANS are atomic hot-potato: borrowBaseAsset/borrowQuoteAsset return [coin, flashLoan]; the FlashLoan object has no drop/store and MUST be consumed by returnBaseAsset/returnQuoteAsset in the SAME Transaction or it aborts. Pattern: borrow -> use coin (swap/place) -> return exact borrowAmount + repay. \n5) SWAP minOut is slippage protection — get it from a fresh getQuoteQuantityOut/getBaseQuantityOut dry-run; deepAmount must cover the DEEP fee (use getOrderDeepRequired / the deepRequired field, or use the *InputFee variants / whitelisted pools to avoid needing DEEP). \n6) After fills, proceeds sit as settled balances inside the manager; call withdrawSettledAmounts (or it's auto-settled on next interaction) then withdrawFromManager to get coins to a wallet. \n7) STAKING for fee discounts: stake DEEP (active next epoch); governance submitProposal/vote require sufficient active stake. \n8) ADMIN tools (createPoolAdmin, adjust*, enable/disableVersion, add/removeStableCoin, setTreasuryAddress, unregisterPoolAdmin) require holding a DeepBookAdminCap object and are NOT for normal agents; createPermissionlessPool is the public path to make a pool (pay DEEP fee). \n\nGOTCHAS: payWithDeep defaults true — on non-whitelisted pools the manager needs DEEP funded or the order fails; whitelisted pools (check via whitelisted()) take zero fees and need no DEEP. expiration is a ms timestamp for limit orders. orderType (NO_RESTRICTION/IMMEDIATE_OR_CANCEL/FILL_OR_KILL/POST_ONLY) and selfMatchingOption (SELF_MATCHING_ALLOWED/CANCEL_TAKER/CANCEL_MAKER) are enums from types/index. modifyOrder can only shrink quantity. There are also *WithManager swap variants that pull from a BalanceManager using tradeCap/depositCap/withdrawCap IDs instead of raw coins. The SDK additionally ships a large MARGIN surface (marginManager/marginPool/marginRegistry/marginLiquidations/marginTPSL/poolProxy) and predict surface — those are OUT OF SCOPE for this v3-spot CLOB catalog and are tracked separately.


## Margin

Complete DeepBook V3 MARGIN tool surface from @mysten/deepbook-v3 (MystenLabs/ts-sdks, packages/deepbook-v3/src). Margin is fully part of V3 and live on mainnet. The SDK exposes EIGHT margin-related transaction-builder contracts plus high-level async query methods on DeepBookClient. Architecture: every contract is constructed with a DeepBookConfig and every method is CURRIED — it returns a `(tx: Transaction) => ...` thunk you pass to `tx.add(...)`. NOTHING here signs or submits; the caller builds a PTB and signs/executes it separately with a Sui keypair/SuiClient. So in agent terms there is no autonomous "write" tool — every "write-sign" below means "this builder emits a moveCall the agent must place in a PTB and then sign+execute." Read methods come in two flavors: (1) on-chain view moveCalls (devInspect-style, return a tx thunk), and (2) high-level async `DeepBookClient.getMargin*` methods that return `Promise<...>` already-decoded — those are the true read tools an agent calls directly.

Eight contracts (client namespace -> class):
  client.marginManager   -> MarginManagerContract   (lifecycle, deposit/withdraw, borrow/repay, liquidate, referral, + ~20 view calls)
  client.marginPool       -> MarginPoolContract       (supply/withdraw liquidity LP-side, supplier cap, supply referral, pool view calls)
  client.poolProxy        -> PoolProxyContract        (THE trading surface for a margin manager: place/cancel/modify orders, reduce-only, stake/unstake/vote/proposal/rebate proxies, updateCurrentPrice)
  client.marginTPSL       -> MarginTPSLContract        (conditional take-profit/stop-loss orders: add/cancel/execute, pending limit/market order builders)
  client.marginRegistry   -> MarginRegistryContract    (read-only registry views: risk ratios, pool enabled, margin pool IDs, manager IDs for owner)  [prompt did not list — included for completeness]
  client.marginLiquidations -> MarginLiquidationsContract (LiquidationVault: create/deposit/withdraw/liquidateBase/liquidateQuote)  [prompt did not list — included]
  client.marginAdmin      -> MarginAdminContract       (ADMIN-CAP gated: register/enable/disable pools, risk params, oracle/Pyth config, version/pause caps, maintainer caps)
  client.marginMaintainer -> MarginMaintainerContract  (MAINTAINER-CAP gated: create margin pools, interest/pool config, enable/disable pool-for-loan)

Key composability finding for Predict: YES, a margin position is composable inside one PTB. newMarginManagerWithInitializer returns {manager, initializer} TransactionArguments; depositDuringInitialization + shareMarginManager let you create+fund+share a leveraged manager atomically. borrowBase/borrowQuote and poolProxy.placeMarketOrder return tx results usable downstream. CRITICAL gotcha: most state-changing margin calls require a FRESH Pyth price — you must call poolProxy.updateCurrentPrice(poolKey) earlier in the same PTB (it needs base+quote priceInfoObjectId), and every borrow/withdraw/order enforces a post-trade risk_ratio >= min_borrow_risk_ratio invariant. Borrowed funds live in the manager's internal BalanceManager, NOT a free coin — you cannot extract leverage as a loose Coin to spend on an external protocol like Predict in the same call; withdraw is debt-gated. So margin leverage composes WITHIN DeepBook trading, but bridging that leverage into a separate Predict market in one atomic PTB is blocked by the debt/risk-ratio withdrawal guard.



### Margin · margin-manager

| Tool | Kind | Params | Returns | Purpose |
|---|---|---|---|---|
| `marginManager.newMarginManager` | write-sign | (poolKey: string) => (tx) | void moveCall (margin_manager::new); creates+shares a MarginManager for the pool | Create a new margin manager bound to a DeepBook pool (retail entry point) |
| `marginManager.newMarginManagerWithInitializer` | write-sign | (poolKey: string) => (tx) | { manager, initializer } TransactionArguments (margin_manager::new_with_initializer) | Create a margin manager WITHOUT sharing yet, so you can deposit/configure in same PTB before sharing — the composable creation path |
| `marginManager.shareMarginManager` | write-sign | (poolKey, manager: TxArg, initializer: TxArg) => (tx) | void moveCall (margin_manager::share) | Share the manager object after init-time deposits; finalizes atomic create+fund flow |
| `marginManager.registerMarginManager` | write-sign | (managerKey: string) => (tx) | void moveCall (register_margin_manager) | Re-register a manager into the margin registry to restore visibility after another platform unregistered it |
| `marginManager.unregisterMarginManager` | write-sign | (managerKey: string) => (tx) | void moveCall (unregister_margin_manager); ABORTS if any debt or base/quote/DEEP balance remains | Remove a manager from the registry (must be fully empty/debt-free first) |
| `marginManager.depositDuringInitialization` | write-sign | (params: DepositDuringInitParams {manager:TxArg, poolKey, coinType, amount\|coin}) => (tx) | void moveCall (margin_manager::deposit) | Deposit collateral into a not-yet-shared manager in the same PTB as creation |
| `marginManager.depositBase` | write-sign | (params: DepositParams {managerKey, amount\|coin}) => (tx) | void moveCall (deposit, typeArg=baseCoin) | Deposit base-asset collateral into an existing margin manager (retail) |
| `marginManager.depositQuote` | write-sign | (params: DepositParams {managerKey, amount\|coin}) => (tx) | void moveCall (deposit, typeArg=quoteCoin) | Deposit quote-asset collateral into a margin manager (retail) |
| `marginManager.depositDeep` | write-sign | (params: DepositParams {managerKey, amount\|coin}) => (tx) | void moveCall (deposit, typeArg=DEEP) | Deposit DEEP into a margin manager to pay trading fees in DEEP |
| `marginManager.withdrawBase` | write-sign | (managerKey: string, amount: number) => (tx) | Coin<Base> result (margin_manager::withdraw); debt/risk-ratio gated | Withdraw base collateral; blocked if it would breach min_withdraw_risk_ratio (retail) |
| `marginManager.withdrawQuote` | write-sign | (managerKey: string, amount: number) => (tx) | Coin<Quote> result; debt/risk-ratio gated | Withdraw quote collateral subject to risk-ratio guard (retail) |
| `marginManager.withdrawDeep` | write-sign | (managerKey: string, amount: number) => (tx) | Coin<DEEP> result; risk-ratio gated | Withdraw DEEP from the manager |
| `marginManager.borrowBase` | write-sign | (managerKey: string, amount: number) => (tx) | moveCall result (borrow_base); needs base margin pool + Pyth price objects | Borrow base asset against collateral to open a leveraged position (CORE retail leverage action) |
| `marginManager.borrowQuote` | write-sign | (managerKey: string, amount: number) => (tx) | moveCall result (borrow_quote) | Borrow quote asset against collateral to lever up (CORE retail leverage action) |
| `marginManager.repayBase` | write-sign | (managerKey: string, amount?: number) => (tx) | moveCall result (repay_base); amount Option<u64>, omit to repay all | Repay borrowed base debt (full or partial) to deleverage / restore risk ratio (retail) |
| `marginManager.repayQuote` | write-sign | (managerKey: string, amount?: number) => (tx) | moveCall result (repay_quote); Option<u64> | Repay borrowed quote debt, full or partial (retail) |
| `marginManager.liquidate` | write-sign | (managerAddress, poolKey, debtIsBase: boolean, repayCoin: TxArg) => (tx) | moveCall result (margin_manager::liquidate) | Liquidate an underwater manager by supplying a repay coin; liquidator/keeper role, not typical retail |
| `marginManager.setMarginManagerReferral` | write-sign | (managerKey: string, referral: string) => (tx) | void moveCall (set_margin_manager_referral) | Attach a DeepBookPoolReferral to the manager for fee sharing |
| `marginManager.unsetMarginManagerReferral` | write-sign | (managerKey: string, poolKey: string) => (tx) | void moveCall (unset_margin_manager_referral) | Remove the manager's referral association |

### Margin · margin-read

| Tool | Kind | Params | Returns | Purpose |
|---|---|---|---|---|
| `marginManager.managerState` | read | (poolKey, marginManagerId) => (tx) | view tuple: (manager_id, deepbook_pool_id, risk_ratio, base_asset, quote_asset, base_debt, quote_debt, base/quote pyth price+decimals) | On-chain view of full manager risk state (devInspect); the key health check before borrowing/withdrawing |
| `marginManager.calculateAssets` | read | (poolKey, marginManagerId) => (tx) | view (base, quote asset values) | Compute current asset value of a manager |
| `marginManager.calculateDebts` | read | (poolKey, coinKey, marginManagerId) => (tx) | view debt for the coin side | Compute outstanding debt (uses margin pool + clock for accrued interest) |
| `marginManager.borrowedShares / borrowedBaseShares / borrowedQuoteShares` | read | (poolKey, marginManagerId) => (tx) | view share counts | Read borrowed share balances backing debt |
| `marginManager.hasBaseDebt / baseBalance / quoteBalance / deepBalance` | read | (poolKey, marginManagerId) => (tx) | view bool / u64 balances | Per-asset balance and debt-flag views on the manager |
| `marginManager.balanceManagerId` | read | (poolKey, marginManagerId) => (tx) | view ID (not &BalanceManager, so it COMPOSES in PTBs) | Get the underlying BalanceManager ID — the composable handle to the manager's internal trading account |
| `marginManager.account / accountOpenOrders / getAccountOrderDetails / lockedBalance / accountExists` | read | (poolKey, marginManagerId) => (tx) | view account data / order IDs / locked balances | Inspect the manager's DeepBook account, open orders, and locked balances |
| `marginManager.canPlaceLimitOrder` | read | (poolKey, marginManagerId, price, quantity, isBid, payWithDeep, expireTimestamp) => (tx) | view bool | Pre-check whether a limit order keeps the manager above min risk ratio before actually placing it |
| `marginManager.canPlaceMarketOrder` | read | (poolKey, marginManagerId, quantity, isBid, payWithDeep) => (tx) | view bool | Pre-check whether a market order is allowed under current risk state |
| `marginTPSL.conditionalOrderIds / conditionalOrder / lowestTriggerAbovePrice / highestTriggerBelowPrice` | read | (poolKey, marginManagerId, conditionalOrderId?) => (tx) | view IDs / order / trigger prices | On-chain views of a manager's armed conditional orders and trigger bounds |
| `marginPool.totalSupply / totalBorrow / supplyShares / borrowShares / interestRate / maxUtilizationRate / supplyCap / minBorrow / protocolSpread / lastUpdateTimestamp / userSupplyShares / userSupplyAmount / getId / deepbookPoolAllowed` | read | (coinKey[, supplierCapId\|deepbookPoolId]) => (tx) | view u64 / bool / ID | On-chain view calls for margin-pool state (utilization, rates, caps, per-supplier balances) |
| `marginRegistry.minBorrowRiskRatio / minWithdrawRiskRatio / liquidationRiskRatio / targetLiquidationRiskRatio / userLiquidationReward / poolLiquidationReward / poolEnabled / getMarginPoolId / baseMarginPoolId / quoteMarginPoolId / getDeepbookPoolMarginPoolIds / getMarginManagerIds / allowedMaintainers / allowedPauseCaps` | read | (poolKey\|coinKey\|owner) => (tx) | view u64 / bool / ID / vector<ID> | Read-only registry views: the risk-ratio thresholds an agent needs to reason about leverage limits, plus pool-enablement and manager-discovery by owner |
| `client.getMarginManagerState` | read | (marginManagerKey, decimals?) => Promise<MarginManagerState> | Promise<MarginManagerState {riskRatio, baseAsset, quoteAsset, baseDebt, quoteDebt, pyth prices, currentPrice, trigger prices}> | High-level decoded async read of a manager's full risk state — THE primary read tool an agent calls to decide borrow/repay/close (no PTB needed) |
| `client.getMarginManagerStates` | read | (marginManagers: string[], decimals?) => Promise<MarginManagerState[]> | Promise<MarginManagerState[]> | Batch-read risk state across many managers (portfolio/monitoring) |
| `client.getMarginManagerAssets / getMarginManagerDebts / getMarginManagerBalances` | read | (marginManagerKey\|managers, decimals?) => Promise<...> | Promise<MarginManagerAssets \| MarginManagerDebts \| balances> | Decoded async reads of a manager's assets, debts, and base/quote/deep balances |
| `client.getMarginManagerOwner / getMarginManagerDeepbookPool / getMarginManagerMarginPoolId / getMarginManagerBalanceManagerId / getMarginManagerBorrowedShares / getMarginManagerHasBaseDebt / getMarginManagerBaseBalance / getMarginManagerQuoteBalance / getMarginManagerDeepBalance` | read | (marginManagerKey\|address[, decimals]) => Promise<...> | Promise<string\|boolean\|BorrowedShares> | Decoded async reads of manager metadata, the composable BalanceManager ID, and per-asset balances/debt flags |
| `client.getMarginManagerIdsForOwner` | read | (owner: string) => Promise<string[]> | Promise<string[]> margin manager object IDs | Discover all margin managers owned by an address — agent entry point to find a user's positions |
| `client.getMarginPoolTotalSupply / getMarginPoolTotalBorrow / getMarginPoolInterestRate / getMarginPoolMaxUtilizationRate / getMarginPoolSupplyCap / getMarginPoolMinBorrow / getMarginPoolProtocolSpread / getMarginPoolSupplyShares / getMarginPoolBorrowShares / getMarginPoolLastUpdateTimestamp / getMarginPoolId / isDeepbookPoolAllowed` | read | (coinKey[, decimals]\|deepbookPoolId) => Promise<string\|number\|boolean> | Promise<...> decoded pool stats | Decoded async reads of margin-pool economics (utilization, interest rate, caps) for lending/borrowing decisions |
| `client.getConditionalOrderIds / getLowestTriggerAbovePrice / getHighestTriggerBelowPrice` | read | (marginManagerKey) => Promise<string[]\|bigint> | Promise<string[] \| trigger price> | Decoded async reads of a manager's armed TP/SL conditional orders and trigger bounds |

### Margin · margin-orders

| Tool | Kind | Params | Returns | Purpose |
|---|---|---|---|---|
| `poolProxy.placeLimitOrder` | write-sign | (params: PlaceMarginLimitOrderParams {poolKey, marginManagerKey, clientOrderId, price, quantity, isBid, expiration?, orderType?, selfMatchingOption?, payWithDeep?}) => (tx) | moveCall result (pool_proxy::place_limit_order_v2); enforces post-trade risk_ratio>=min_borrow_risk_ratio | Place a limit order FROM a margin manager (THE retail leveraged-trading action). Needs fresh Pyth price + base/quote margin pools |
| `poolProxy.placeMarketOrder` | write-sign | (params: PlaceMarginMarketOrderParams {poolKey, marginManagerKey, clientOrderId, quantity, isBid, selfMatchingOption?, payWithDeep?}) => (tx) | moveCall result (place_market_order_v2); risk-ratio invariant | Place a market order from a margin manager — the simplest way to take a leveraged position (retail) |
| `poolProxy.placeReduceOnlyLimitOrder` | write-sign | (params: PlaceMarginLimitOrderParams) => (tx) | moveCall (place_reduce_only_limit_order_v2); requires existing debt; enforces risk_ratio_after>=risk_ratio_before (monotonic) | Reduce-only limit order to safely unwind a leveraged position without leaking value (retail risk management) |
| `poolProxy.placeReduceOnlyMarketOrder` | write-sign | (params: PlaceMarginMarketOrderParams) => (tx) | moveCall (place_reduce_only_market_order_v2); monotonic risk-ratio guard | Reduce-only market order to deleverage/close a position at market (retail) |
| `poolProxy.modifyOrder / cancelOrder / cancelOrders / cancelAllOrders` | write-sign | (marginManagerKey, orderId\|orderIds\|newQuantity) => (tx) | void moveCall (pool_proxy::modify_order / cancel_order / cancel_orders / cancel_all_orders) | Manage existing open orders of a margin manager (retail order management) |
| `poolProxy.withdrawSettledAmounts` | write-sign | (marginManagerKey) => (tx) | void moveCall (withdraw_settled_amounts) | Settle filled-order proceeds back into the manager's balances (owner call) |
| `poolProxy.withdrawMarginSettledAmounts` | write-sign | (poolKey, marginManagerId) => (tx) | void moveCall (withdraw_settled_amounts_permissionless) | Permissionless settle of a manager's filled orders by object ID (keeper-friendly) |

### Margin · margin-oracle

| Tool | Kind | Params | Returns | Purpose |
|---|---|---|---|---|
| `poolProxy.updateCurrentPrice` | write-sign | (poolKey) => (tx) | void moveCall (pool_proxy::update_current_price); throws in SDK if priceInfoObjectId missing | Push fresh Pyth base+quote price into the pool — MANDATORY prerequisite earlier in the PTB before borrow/withdraw/order/admin price calls |

### Margin · margin-governance

| Tool | Kind | Params | Returns | Purpose |
|---|---|---|---|---|
| `poolProxy.stake / unstake` | write-sign | (marginManagerKey, stakeAmount?) => (tx) | void moveCall (pool_proxy::stake / unstake) | Stake/unstake DEEP from a margin manager to earn maker incentives / fee discounts (governance proxy) |
| `poolProxy.submitProposal / vote` | write-sign | (marginManagerKey, MarginProposalParams {takerFee,makerFee,stakeRequired}) / (marginManagerKey, proposalId) => (tx) | void moveCall (pool_proxy::submit_proposal / vote) | Participate in pool fee governance from a margin manager (proxy for the manager's stake weight) |
| `poolProxy.claimRebate` | write-sign | (marginManagerKey) => (tx) | void moveCall (pool_proxy::claim_rebates) | Claim trading-fee rebates accrued to the margin manager |

### Margin · margin-tpsl

| Tool | Kind | Params | Returns | Purpose |
|---|---|---|---|---|
| `marginTPSL.addConditionalOrder` | write-sign | (params: AddConditionalOrderParams {marginManagerKey, conditionalOrderId, triggerBelowPrice, triggerPrice, pendingOrder: PendingLimit\|PendingMarket}) => (tx) | void moveCall (margin_manager::add_conditional_order); internally builds condition + pending order | Attach a take-profit or stop-loss to a leveraged position (CORE retail risk automation) |
| `marginTPSL.cancelConditionalOrder / cancelAllConditionalOrders` | write-sign | (marginManagerKey, conditionalOrderId?) => (tx) | void moveCall (cancel_conditional_order / cancel_all_conditional_orders) | Remove one or all TP/SL conditional orders (retail) |
| `marginTPSL.executeConditionalOrders` | write-sign | (managerAddress, poolKey, maxOrdersToExecute) => (tx) | moveCall (execute_conditional_orders_v2); PERMISSIONLESS; aborts if post-fill risk_ratio < min_borrow_risk_ratio | Trigger execution of armed TP/SL orders for any manager — keeper/anyone can call (automation surface) |
| `marginTPSL.newPendingLimitOrder` | write-sign | (poolKey, PendingLimitOrderParams) => (tx) | pending-order TxArg (tpsl::new_pending_limit_order) | Build the pending LIMIT order payload to embed inside a conditional (TP/SL) order |
| `marginTPSL.newPendingMarketOrder` | write-sign | (poolKey, PendingMarketOrderParams) => (tx) | pending-order TxArg (tpsl::new_pending_market_order) | Build the pending MARKET order payload for a conditional (TP/SL) order |
| `marginTPSL.newCondition` | write-sign | (poolKey, triggerBelowPrice: boolean, triggerPrice) => (tx) | condition TxArg (tpsl::new_condition) | Build the price-trigger condition object used by addConditionalOrder |

### Margin · margin-lp

| Tool | Kind | Params | Returns | Purpose |
|---|---|---|---|---|
| `marginPool.mintSupplierCap` | write-sign | () => (tx) | SupplierCap object (margin_pool::mint_supplier_cap) | Mint a supplier cap to become a liquidity supplier (lender) to a margin pool |
| `marginPool.supplyToMarginPool` | write-sign | (coinKey, supplierCap: TxArg, amountToDeposit, referralId?) => (tx); sets sender | void moveCall (margin_pool::supply) | Supply liquidity to a margin pool to earn lending interest (LP/lender retail flow distinct from borrower flow) |
| `marginPool.withdrawFromMarginPool` | write-sign | (coinKey, supplierCap: TxArg, amountToWithdraw?) => (tx); omit amount to withdraw all | Coin result (margin_pool::withdraw) | Withdraw supplied liquidity + accrued interest from a margin pool (LP/lender) |
| `marginPool.mintSupplyReferral / withdrawReferralFees` | write-sign | (coinKey, referralId?) => (tx) | SupplyReferral object / Coin fees | Mint a supply-referral and later claim referral fees on supplied liquidity |

### Margin · margin-liquidation

| Tool | Kind | Params | Returns | Purpose |
|---|---|---|---|---|
| `marginLiquidations.liquidateBase / liquidateQuote` | write-sign | (vaultId, managerAddress, poolKey, repayAmount?) => (tx) | void moveCall (liquidation_vault::liquidate_base/quote); repayAmount Option, omit for full | Liquidate an underwater manager via a LiquidationVault (keeper/liquidator role, NOT retail) |
| `marginLiquidations.createLiquidationVault / deposit / withdraw / balance` | admin | (vaultId, liquidationAdminCap, coinKey, amount) => (tx) | void / Coin / view u64 | Manage a LiquidationVault's funds (liquidationAdminCap gated; operator-only) |

### Margin · admin

| Tool | Kind | Params | Returns | Purpose |
|---|---|---|---|---|
| `marginAdmin.registerDeepbookPool / enableDeepbookPool / disableDeepbookPool` | admin | (poolKey[, poolConfig: TxArg]) => (tx); requires MARGIN_ADMIN_CAP | void moveCall (margin_registry::register/enable/disable_deepbook_pool) | Admin: onboard/enable/disable a DeepBook pool for margin trading (NOT retail) |
| `marginAdmin.updateRiskParams / setPriceTolerance / setMaxPriceAge / setMaxOrderTtl` | admin | (poolKey, value/poolConfig) => (tx); MARGIN_ADMIN_CAP | void moveCall | Admin: tune per-pool risk params, oracle price tolerance/age, and max margin-order TTL |
| `marginAdmin.newPoolConfig / newPoolConfigWithLeverage / newCoinTypeData / newPythConfig / addConfig / removeConfig` | admin | (poolKey, PoolConfigParams \| leverage \| coinSetups) => (tx) | config object TxArg / void | Admin: build pool/oracle/Pyth config objects and attach/detach PythConfig to the registry |
| `marginAdmin.mintMaintainerCap / revokeMaintainerCap / mintPauseCap / revokePauseCap / enableVersion / disableVersion / disableVersionPauseCap / adminWithdrawDefaultReferralFees` | admin | (version\|capId\|coinKey) => (tx); MARGIN_ADMIN_CAP | cap object / void / Coin | Admin: cap lifecycle, protocol version gating, emergency pause, and default-referral fee sweep |
| `marginMaintainer.createMarginPool` | admin | (coinKey, poolConfig: TxArg) => (tx); requires MARGIN_MAINTAINER_CAP | void moveCall (margin_pool::create_margin_pool) | Maintainer: create a new lending margin pool for a coin (NOT retail) |
| `marginMaintainer.newProtocolConfig / newMarginPoolConfig / newMarginPoolConfigWithRateLimit / newInterestConfig` | admin | (coinKey, MarginPoolConfigParams\|InterestConfigParams) => (tx) | config object TxArg | Maintainer: build protocol/pool/interest/rate-limit config objects for a margin pool |
| `marginMaintainer.enableDeepbookPoolForLoan / disableDeepbookPoolForLoan / updateInterestParams / updateMarginPoolConfig` | admin | (deepbookPoolKey\|coinKey, marginPoolCap: TxArg, config) => (tx) | void moveCall | Maintainer: whitelist a DeepBook pool as a borrow target for a margin pool and update interest/pool config (marginPoolCap gated) |


**Margin notes:** PTB CONSTRUCTION RECIPE (retail leveraged-trade open):
1. const tx = new Transaction()
2. tx.add(client.poolProxy.updateCurrentPrice('SUI_DBUSDC'))  // MANDATORY: pushes fresh Pyth base+quote price; every borrow/withdraw/order reads it. Fails if coin.priceInfoObjectId unset in config.
3. tx.add(client.marginManager.depositQuote({managerKey, amount}))  // post collateral
4. tx.add(client.marginManager.borrowQuote(managerKey, borrowAmt))   // take leverage; needs the quote margin pool + Pyth objects
5. tx.add(client.poolProxy.placeMarketOrder({poolKey, marginManagerKey, clientOrderId, quantity, isBid, payWithDeep}))  // enter position; enforces post-trade risk_ratio >= min_borrow_risk_ratio
6. optionally tx.add(client.marginTPSL.addConditionalOrder({...}))   // arm stop-loss/take-profit
7. sign+execute with your SuiClient/keypair. The SDK NEVER signs.

ATOMIC CREATE+FUND+SHARE (composable manager bootstrap):
const {manager, initializer} = ... via newMarginManagerWithInitializer(poolKey)(tx);  -> depositDuringInitialization({manager, poolKey, coinType, amount})(tx) -> shareMarginManager(poolKey, manager, initializer)(tx). All in one PTB.

SEQUENCING GOTCHAS an agent MUST respect:
- updateCurrentPrice MUST precede any borrow/withdraw/order/managerState in the SAME PTB or the price is stale/uninitialized. marginAdmin.setPriceTolerance/setMaxPriceAge also require price initialized first.
- Withdrawals are debt-gated (min_withdraw_risk_ratio); borrows/orders are gated (min_borrow_risk_ratio); reduce-only orders enforce monotonic risk_ratio_after >= risk_ratio_before. Use canPlaceLimitOrder/canPlaceMarketOrder or read getMarginManagerState.riskRatio BEFORE attempting, to avoid abort.
- repayBase/repayQuote take an Option<u64> amount; pass undefined to repay the full debt.
- Borrowed funds are credited to the manager's INTERNAL BalanceManager, not handed back as a loose Coin. Withdrawing them out is debt/risk gated.
- Two distinct retail personas: BORROWER/trader (marginManager + poolProxy + marginTPSL) vs LENDER/LP (marginPool.supply/withdraw with a SupplierCap). Don't conflate.
- Caps required: marginAdmin needs MARGIN_ADMIN_CAP; marginMaintainer needs MARGIN_MAINTAINER_CAP / marginPoolCap; marginLiquidations vault ops need liquidationAdminCap. The SDK throws if the cap env var is unset. These are NOT retail-agent tools.

RETAIL-AGENT vs ADMIN/MAINTAINER split:
- RETAIL (an autonomous trading agent uses these): marginManager.{newMarginManager(WithInitializer), depositBase/Quote/Deep, withdrawBase/Quote, borrowBase/Quote, repayBase/Quote}; ALL of poolProxy (place/cancel/modify/reduce-only/stake/vote/updateCurrentPrice); ALL of marginTPSL; marginPool.{mintSupplierCap, supplyToMarginPool, withdrawFromMarginPool} for the LP side; and every read (marginManager views, marginRegistry risk-ratio views, and especially the high-level client.getMargin* async reads).
- KEEPER/LIQUIDATOR (semi-permissionless): marginManager.liquidate, marginLiquidations.liquidateBase/Quote, marginTPSL.executeConditionalOrders (anyone can call), poolProxy.withdrawMarginSettledAmounts.
- ADMIN/MAINTAINER ONLY (never a retail agent): entire marginAdmin + marginMaintainer classes, marginLiquidations vault create/deposit/withdraw.

COMPOSING MARGIN WITH PREDICT (the load-bearing question):
- WITHIN DeepBook, margin is fully composable in one PTB: create+fund+borrow+trade+arm-TPSL atomically, and managerState/balanceManagerId return plain IDs/values (not borrowed object refs) so they thread through a PTB cleanly.
- ACROSS to Predict: leverage CANNOT be trivially bridged into a separate Predict market in the same atomic call. borrow* credits the manager's internal BalanceManager; the only way to get a spendable Coin out is withdraw*, which is debt/risk-ratio gated and will abort if it would push the manager below min_withdraw_risk_ratio. So you cannot borrow against collateral and atomically hand that borrowed Coin to a Predict bet within DeepBook's invariants. Realistic composition pattern for a Predict integration: use DeepBook margin to run a LEVERAGED HEDGE/DIRECTIONAL TRADE that mirrors or offsets a Predict position (two coordinated PTBs, or Predict funded from free wallet coins while margin runs the correlated spot/perp-like leg), and use the read surface (getMarginManagerState.riskRatio, getMarginManagerDebts) to keep the combined position solvent. True single-PTB 'lever up then bet on Predict' is blocked by the withdrawal risk-gate.


**Sources:** https://raw.githubusercontent.com/MystenLabs/ts-sdks/main/packages/deepbook-v3/src/client.ts; https://raw.githubusercontent.com/MystenLabs/ts-sdks/main/packages/deepbook-v3/src/transactions/deepbook.ts; https://raw.githubusercontent.com/MystenLabs/ts-sdks/main/packages/deepbook-v3/src/transactions/balanceManager.ts; https://raw.githubusercontent.com/MystenLabs/ts-sdks/main/packages/deepbook-v3/src/transactions/flashLoans.ts; https://raw.githubusercontent.com/MystenLabs/ts-sdks/main/packages/deepbook-v3/src/transactions/governance.ts; https://raw.githubusercontent.com/MystenLabs/ts-sdks/main/packages/deepbook-v3/src/transactions/deepbookAdmin.ts; https://raw.githubusercontent.com/MystenLabs/ts-sdks/main/packages/deepbook-v3/src/types/index.ts; https://raw.githubusercontent.com/MystenLabs/ts-sdks/main/packages/deepbook-v3/src/transactions/marginManager.ts; https://raw.githubusercontent.com/MystenLabs/ts-sdks/main/packages/deepbook-v3/src/transactions/marginPool.ts; https://raw.githubusercontent.com/MystenLabs/ts-sdks/main/packages/deepbook-v3/src/transactions/marginAdmin.ts; https://raw.githubusercontent.com/MystenLabs/ts-sdks/main/packages/deepbook-v3/src/transactions/marginMaintainer.ts; https://raw.githubusercontent.com/MystenLabs/ts-sdks/main/packages/deepbook-v3/src/transactions/marginTPSL.ts; https://raw.githubusercontent.com/MystenLabs/ts-sdks/main/packages/deepbook-v3/src/transactions/poolProxy.ts; https://raw.githubusercontent.com/MystenLabs/ts-sdks/main/packages/deepbook-v3/src/transactions/marginRegistry.ts; https://raw.githubusercontent.com/MystenLabs/ts-sdks/main/packages/deepbook-v3/src/transactions/marginLiquidations.ts; https://raw.githubusercontent.com/MystenLabs/ts-sdks/main/packages/deepbook-v3/src/types/index.ts; https://raw.githubusercontent.com/MystenLabs/ts-sdks/main/packages/deepbook-v3/src/client.ts