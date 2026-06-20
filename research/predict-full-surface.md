# DeepBook Predict — Full Tool Surface

_No SDK exists; writes are hand-built PTBs. Testnet branch `predict-testnet-4-16`. Addresses provisional (change at mainnet)._

probe budget: minimal 22-tool array (3826) + ~2000-byte notes to find the ceiling.



### balance-manager

| Tool | Kind | Params | Returns | Purpose |
|---|---|---|---|---|
| `create_manager` | write-sign | ctx | PTB;PredictManager | create account |
| `deposit_to_manager` | write-sign | manager,coin | PTB | fund dUSDC |

### predict-write

| Tool | Kind | Params | Returns | Purpose |
|---|---|---|---|---|
| `mint` | write-sign | MarketKey,qty | PTB | buy binary |
| `redeem` | write-sign | MarketKey,qty | PTB;owner | close binary |
| `redeem_permissionless` | write-sign | settled | PTB;owner | keeper crank |
| `mint_range` | write-sign | RangeKey,qty | PTB | buy corridor |
| `redeem_range` | write-sign | RangeKey,qty | PTB | close corridor |

### swaps

| Tool | Kind | Params | Returns | Purpose |
|---|---|---|---|---|
| `supply` | write-sign | coin | PTB;PLP | LP deposit |
| `withdraw` | write-sign | PLP | PTB;dUSDC | LP withdraw |

### predict-read

| Tool | Kind | Params | Returns | Purpose |
|---|---|---|---|---|
| `get_trade_amounts` | read | MarketKey | cost,payout | quote binary |
| `get_range_trade_amounts` | read | RangeKey | cost,payout | quote corridor |
| `ask_bounds` | read | oracle_id | min,max | ask band |
| `oracle_price_curve_build_curve` | read | strike | smile N(d2) | odds smile |
| `available_withdrawal` | read | clock | u64 | max withdraw |
| `predict_config_getters` | read | getters | scalars | config |
| `oracle_view_getters` | read | getters | OracleSVI | market read |
| `manager_view_getters` | read | getters | qty,bal | position read |

### indexer-read

| Tool | Kind | Params | Returns | Purpose |
|---|---|---|---|---|
| `GET /status` | read | none | lag | health |
| `GET /oracles` | read | status | rows | discover markets |
| `oracle_indexer_reads` | read | /oracles/:id/state\|prices\|svi\|ask-bounds | market data | per-market |
| `predict_indexer_reads` | read | /predicts/:id/state\|vault/summary\|vault/performance | vault data | dashboard |
| `manager_indexer_reads` | read | /managers/:id/summary\|positions\|pnl;/managers | account data | account+discovery |


**PTB construction / flow notes:** SIGNATURES (verbatim predict.move; write type-arg Quote=dUSDC; M=mut ref, R=imm ref): create_manager(ctx M):ID. mint Quote(predict M Predict, manager M PredictManager, oracle R OracleSVI, key MarketKey, quantity u64, clock R Clock, ctx M). redeem Quote(same)=owner-only. redeem_permissionless Quote(same)=any signer, requires settled. mint_range/redeem_range Quote(same, key RangeKey). supply Quote(predict M, coin Coin Quote, clock, ctx):Coin PLP. withdraw Quote(predict M, lp_coin Coin PLP, clock, ctx):Coin Quote. get_trade_amounts(predict R, oracle R, key MarketKey, quantity u64, clock):(u64,u64). get_range_trade_amounts(... RangeKey ...):(u64,u64). ask_bounds(predict R, oracle_id ID):(u64,u64). available_withdrawal(predict R, clock):u64. predict_manager::deposit T(self M, coin Coin T, ctx); predict_manager::withdraw T(self M, amount u64, ctx):Coin T. market_key::new(oracle_id ID, expiry u64, strike u64, is_up bool):MarketKey (also up()/down() 3-arg). range_key::new(oracle_id ID, expiry u64, lower_strike u64, higher_strike u64):RangeKey. Structs: MarketKey{oracle_id,expiry,strike,direction u8}; RangeKey{oracle_id,expiry,lower_strike,higher_strike}; OracleSVI{underlying_asset,expiry,prices(spot,forward),svi(a,b,rho i64,m i64,sigma),settlement_price Option,active}.
IDS: PKG=0xf5ea2b3749c65d6e56507cc35388719aadb28f9cab873696a2f8687f5c785138; Registry=0x43af14fed5480c20ff77e2263d5f794c35b9fab7e2212903127062f4fe2a6e64; PREDICT_OBJ=0xc8736204d12f0a7277c86388a68bf8a194b0a14c5538ad13f22cbd8e2a38028a; DUSDC=...::dusdc::DUSDC; Clock=0x6.
PTB: build key in-PTB via market_key::new(oracleId,expiry,strike,isUp) then predict::mint typeArgs[DUSDC] args[PREDICT_OBJ,managerId,oracleId,key,qty,0x6]. RangeKey via range_key::new. redeem* same arg order as mint. SMILE up=N(d2): k=ln(strike/forward), w=a+b*(rho*(k-m)+sqrt((k-m)^2+sigma^2)), d2=-((k+w/2)/sqrt(w)); DOWN=1-up; corridor=up(lo)-up(hi). FLOW: create_manager->deposit dUSDC->read odds->mint(/range)->settle->redeem(/permissionless)->withdraw; LP supply->withdraw. ERRORS: 0..9 ETradingPaused,ENotOwner,EWithdrawExceedsAvailable,EZeroQuantity,EZeroAmount,EZeroVaultValue,EZeroSharesMinted,EAskPriceOutOfBounds,EAskBoundLooserThanGlobal,EOracleNotSettled.


**Sources:** https://raw.githubusercontent.com/MystenLabs/deepbookv3/predict-testnet-4-16/packages/predict/sources/predict.move; https://predict-server.testnet.mystenlabs.com/status