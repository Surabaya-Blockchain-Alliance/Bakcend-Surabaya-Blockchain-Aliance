const axios = require('axios');
const CML = require('@dcspark/cardano-multiplatform-lib-nodejs');
const cbor = require('cbor');
const express = require('express');
const app = express();
app.use(express.json());

const API_KEY = ''; 
const API_URL = 'https://cardano-preprod.blockfrost.io/api/v0';

const QUEST_TOKEN_NAME = 'QuestNFT1';
const QUEST_POLICY_ID = 'f0ff48bbb7bbe9d59a40f1ce90e9e9d0ff5002ec48f232b49ca0fb9a';
const QUEST_SCRIPT_CBOR = '59035b0101002229800aba2aba1aba0aab9faab9eaab9dab9a9bae00348888888966003300130043754013370e90014dd2a4001370e9000244446465300130093754003223259800980418061baa0018a5eb7bdb18226eacc040c034dd5000a01632330010010032259800800c530103d87a8000899192cc004cdc8802800c56600266e3c0140062601466024602000497ae08a60103d87a80004039133004004301400340386eb8c038004c04400500f4c03401a601a00491112cc004c02401226466446644b3001300c3012375400513259800980798099baa0018992cc004c064006264b30013370e6eb4c0580052001899b8f375c602a00202714a080a0c0600062c80b0cc024dd5980b980c180c180c180c0021bae301730143754003164048602c60266ea8c058c04cdd5180b180b98099baa30163013375400516404464660020026eb0c054008896600200314c0103d87a80008992cc004cdd7980b980a1baa001005898071980b000a5eb8226600600660300048090c058005014180a180a801980900098079baa003300e375400b159800980380244c8cc8966002601400315980098089baa0048014590124566002601800315980098089baa00480145901245900f201e13232332259800980b800c4c966002601a60266ea801e2b300132330010013758603000c44b30010018a508acc004cdd7980c980b1baa301900101c8a51899801001180d000a028405d1324a266e95200433016300e330164c10b4a4570696320517565737400330164c130582e436f6d706c6574652074686973206570696320717565737420746f206561726e207261726520726577617264732100330164c10a493130303020476f6c6400330164c10a4971756573745f30303100330164c1044301020300330164c10b4a4045706963517565737400330164c10f4e457069635175657374233132333400330164c1104f4045706963517565737447726f757000330164c11f581d68747470733a2f2f6570696371756573742e6578616d706c652e636f6d004bd7025eb822c80922b30013370e6eb4c0500052001899b8f375c602600202314a08091012180b000c590141bac30140013300637566028602a602a00200660286028002601e6ea800cc038dd50011bae3011300e375400b16403080606018601a00260180088a4d1365640081';

const EVENT_TOKEN_NAME = 'EventNFT1';
const EVENT_POLICY_ID = 'f0ff48bbb7bbe9d59a40f1ce90e9e9d0ff5002ec48f232b49ca0fb9a';
const EVENT_SCRIPT_CBOR = '59035b0101002229800aba2aba1aba0aab9faab9eaab9dab9a9bae00348888888966003300130043754013370e90014dd2a4001370e9000244446465300130093754003223259800980418061baa0018a5eb7bdb18226eacc040c034dd5000a01632330010010032259800800c530103d87a8000899192cc004cdc8802800c56600266e3c0140062601466024602000497ae08a60103d87a80004039133004004301400340386eb8c038004c04400500f4c03401a601a00491112cc004c02401226466446644b3001300c3012375400513259800980798099baa0018992cc004c064006264b30013370e6eb4c0580052001899b8f375c602a00202714a080a0c0600062c80b0cc024dd5980b980c180c180c180c0021bae301730143754003164048602c60266ea8c058c04cdd5180b180b98099baa30163013375400516404464660020026eb0c054008896600200314c0103d87a80008992cc004cdd7980b980a1baa001005898071980b000a5eb8226600600660300048090c058005014180a180a801980900098079baa003300e375400b159800980380244c8cc8966002601400315980098089baa0048014590124566002601800315980098089baa00480145901245900f201e13232332259800980b800c4c966002601a60266ea801e2b300132330010013758603000c44b30010018a508acc004cdd7980c980b1baa301900101c8a51899801001180d000a028405d1324a266e95200433016300e330164c10b4a4570696320517565737400330164c130582e436f6d706c6574652074686973206570696320717565737420746f206561726e207261726520726577617264732100330164c10a493130303020476f6c6400330164c10a4971756573745f30303100330164c1044301020300330164c10b4a4045706963517565737400330164c10f4e457069635175657374233132333400330164c1104f4045706963517565737447726f757000330164c11f581d68747470733a2f2f6570696371756573742e6578616d706c652e636f6d004bd7025eb822c80922b30013370e6eb4c0500052001899b8f375c602600202314a08091012180b000c590141bac30140013300637566028602a602a00200660286028002601e6ea800cc038dd50011bae3011300e375400b16403080606018601a00260180088a4d1365640081';

function metadataToCbor(metadata) {
  const cborData = {
    map: Object.entries(metadata).map(([k, v]) => ({
      k: { string: k },
      v: { string: v }
    }))
  };
  return Buffer.from(cbor.encode(cborData)).toString('hex');
}

async function buildTransaction(metadata, walletAddress, scriptCbor, tokenName, policyId) {
  try {
    if (!metadata || !metadata.name || !metadata.url || !metadata.author) {
      throw new Error('Metadata must include name, url, and author');
    }

    const baseAddress = CML.Address.from_bech32(walletAddress);

    const protocolParams = await axios.get(`${API_URL}/epochs/latest/parameters`, {
      headers: { 'project_id': API_KEY }
    }).then(res => res.data);

    const utxos = await axios.get(`${API_URL}/addresses/${walletAddress}/utxos`, {
      headers: { 'project_id': API_KEY }
    }).then(res => res.data);
    const inputUtxo = utxos.find(utxo => utxo.tx_hash + '#' + utxo.output_index === '9c087132a325f6483aca8398bab1a56eda1390e762984ba054c25cafd738486c#1');
    if (!inputUtxo) throw new Error('UTxO reference not found');
    const txBuilderConfigs = CML.TransactionBuilderConfigBuilder.new()
      .fee_algorithm(CML.LinearFee.new(
        CML.BigNum.from_str(protocolParams.min_fee_a.toString()),
        CML.BigNum.from_str(protocolParams.min_fee_b.toString())
      ))
      .pool_deposit(CML.BigNum.from_str(protocolParams.pool_deposit))
      .key_deposit(CML.BigNum.from_str(protocolParams.key_deposit))
      .coins_per_utxo_byte(CML.BigNum.from_str(protocolParams.coins_per_utxo_size))
      .max_value_size(protocolParams.max_val_size)
      .max_tx_size(protocolParams.max_tx_size)
      .build();

    const txBuilder = CML.TransactionBuilder.new(txBuilderConfigs);
    const txHash = CML.TransactionHash.from_hex(inputUtxo.tx_hash);
    const txInput = CML.TransactionInput.new(txHash, inputUtxo.output_index);
    txBuilder.add_input(
      baseAddress,
      txInput,
      CML.Value.new(CML.BigNum.from_str(inputUtxo.amount.find(a => a.unit === 'lovelace').quantity))
    );
    const script = CML.PlutusScript.from_hex(scriptCbor);
    const policyIdScript = Buffer.from(script.hash().to_bytes()).toString('hex');
    if (policyIdScript !== policyId) throw new Error(`Policy ID mismatch: expected ${policyId}, got ${policyIdScript}`);
    const assetName = CML.AssetName.new(Buffer.from(tokenName, 'utf8'));
    const multiAsset = CML.MultiAsset.new();
    const assets = CML.Assets.new();
    assets.insert(assetName, CML.BigNum.from_str('1'));
    multiAsset.insert(script.hash(), assets);
    txBuilder.set_mint(
      CML.Mint.new().insert(script.hash(), CML.MintAssets.new().insert(assetName, CML.Int.new_i32(1))),
      CML.PlutusScripts.new().add(script),
      CML.PlutusData.new_integer(CML.BigInt.from_str('0'))
    );
    const datumCbor = metadataToCbor(metadata);
    const plutusDatum = CML.PlutusData.from_hex(datumCbor);
    const outputValue = CML.Value.new(CML.BigNum.from_str('2000000'));
    outputValue.set_multiasset(multiAsset);
    txBuilder.add_output(
      CML.TransactionOutputBuilder.new()
        .with_address(baseAddress)
        .next()
        .with_value(outputValue)
        .with_plutus_data(plutusDatum)
        .build()
    );
    const slotResponse = await axios.get(`${API_URL}/blocks/latest`, {
      headers: { 'project_id': API_KEY }
    }).then(res => res.data.slot);
    txBuilder.set_ttl(slotResponse + 1000);
    txBuilder.add_change_if_needed(baseAddress);
    const txBody = txBuilder.build();

    return Buffer.from(txBody.to_bytes()).toString('hex');
  } catch (error) {
    throw new Error(`Transaction build failed: ${error.message}`);
  }
}

app.post('/build-quest-transaction', async (req, res) => {
  try {
    const { eventMetadata, walletAddress } = req.body;
    const txBodyCbor = await buildTransaction(eventMetadata, walletAddress, QUEST_SCRIPT_CBOR, QUEST_TOKEN_NAME, QUEST_POLICY_ID);
    res.json({ txBodyCbor });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/build-event-transaction', async (req, res) => {
  try {
    console.log('Incoming Request:', req.body);
    const { eventMetadata, walletAddress } = req.body;
    if (!eventMetadata || !eventMetadata.name || !eventMetadata.url || !eventMetadata.author) {
      return res.status(400).json({ error: 'Metadata must include name, url, and author' });
    }

    // Construct transaction body for event NFT
    const txBodyCbor = await buildTransaction(
      eventMetadata,
      walletAddress,
      EVENT_SCRIPT_CBOR,
      EVENT_TOKEN_NAME,
      EVENT_POLICY_ID
    );

    console.log(txBodyCbor)

    res.json({ txBodyCbor });
  } catch (error) {
    console.error('Error building transaction:', error.message);
    res.status(500).json({ error: error.message });
  }
});




app.listen(3000, () => {
  console.log('Server started on port 3000');
});
