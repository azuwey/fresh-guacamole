# Fresh-guacamole

Fresh-guacamole is a multi-sig wallet with Rust, Typescript, Solana, Next.JS, React and Tailwind.

## Building contract

```shell
npm run contract:build
```

## Deploying contract

You need to create a new account

```shell
solana-keygen new --outfile solana-wallet/keypair.json
```

Airdrop funds

```shell
solana airdrop 1 $(solana-keygen pubkey solana-wallet/keypair.json)
```

deploy

```shell
npm run contract:deploy
```