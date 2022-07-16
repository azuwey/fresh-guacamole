# Fresh-guacamole

Fresh-guacamole is a multi-sig wallet with Rust, Typescript, Solana, Next.JS, React and Tailwind.

## Requirements

- `npm 8.x or up` or `yarn equivalent`
- `Node.JS 16.x or up`
- `solana 1.7.9 or up`
- `Rust, Cargo`

## Setting up the application

### Building and deploying the contract

To build the contract run the following command:

```shell
npm run contract:build
```

To deploy the contract first you need to make sure that you are using a local validator:

```shell
solana config set --url http://127.0.0.1:8899
```

After that navigate to the root directory of the project where you should see a `solana-wallet` folder, here you need
to run the following command to create a new account, that we are going to use for the deployment:

```shell
solana-keygen new --outfile solana-wallet/keypair.json
```

After that you're going to need some funds available to deploy the contract:

```shell
solana airdrop 500 $(solana-keygen pubkey solana-wallet/keypair.json)
```

Now we can deploy the contract to our `local` network

```shell
npm run contract:deploy
```

### Client application setup

#### Contract setup

The application is need to use the application that we just deployed, in the terminal you should see something like this:

```shell
RPC URL: http://127.0.0.1:8899
Default Signer Path: solana-wallet/keypair.json
Commitment: confirmed
Program Id: 6QhuZSVhdX6NFR6FFparMqCFRqwzjWNaSFXVxvZrEwuj
```

From that we need the copy the `Program Id` to a `.env` file. Create a `.env` file under the [`client`](/client) folder,
with the following content:

```text
NEXT_PUBLIC_DEFAULT_PROGRAM_ID=<YOUR_PROGRAM_ID>
```

and replace the `<YOUR_PROGRAM_ID>` with your `Program Id` in my case it would be
`6QhuZSVhdX6NFR6FFparMqCFRqwzjWNaSFXVxvZrEwuj`, so:

```text
NEXT_PUBLIC_DEFAULT_PROGRAM_ID=6QhuZSVhdX6NFR6FFparMqCFRqwzjWNaSFXVxvZrEwuj
```

#### Installing the dependencies

To install the dependencies use the following command from the root directory of the project:

```shell
npm i
```

#### Running the application in development mode

To run the application in development mode:

```shell
npm run start:dev
```

Now you should be able to access the application at `http://localhost:3000`.

## Basic use the application

First you need to create at least two wallet to create a multi signature wallet, and you need to airdrop  some funds to
the `Wallet #1`, after you have at least two wallets, and funds on at least on the `Wallet #1` you be to create a multi
signature wallet. *If you set a different `threshold` after you created the multi signature wallet, the fee will be
deducted from `Wallet #1`*.

To send funds to another account from the application you need to have more than `0 SOL` in the account and in the `PDA`,
and the funds will always be deducted from the `PDA`'s balance. It could happen that even tho you sent some funds to an
account and the funds got deducted from the `PDA`'s balance, you don't see it on the other account, in this case you
need to refresh the balance on that account. *FYI at the moment you cannot send fund to the `PDA`, you need to airdrop
it.*

To remove an owner from the multi signature wallet you need to have at least as many owners in the multi signature
wallet that you have set the threshold, so it will fail if you currently have `2` owners in the multi signature wallet
and the threshold set to `2` and the same true for the threshold, so you cannot higher threshold than the number of
owners in the multi signature wallet.
