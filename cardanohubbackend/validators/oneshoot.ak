use aiken/collection/dict
use aiken/collection/list
use aiken/primitive/bytearray
use cardano/address.{Script}
use cardano/assets.{PolicyId}
use cardano/transaction.{OutputReference, Transaction, InlineDatum} as tx
use aiken/crypto.{VerificationKeyHash}

pub type Action {
  CheckMint
  CheckBurn
}

pub type EventNFT {
  url: ByteArray,
  event_name: ByteArray,
  image: ByteArray,
  date: ByteArray,
  author: VerificationKeyHash
}

validator event_nft(token_name: ByteArray, utxo_ref: OutputReference) {
  spend(_d, _r, own_ref: OutputReference, transaction: Transaction) -> Bool {
    let Transaction { mint, inputs, .. } = transaction
    
    expect Some(own_input) = list.find(inputs, fn(input) { input.output_reference == own_ref })
    
    expect Script(policy_id) = own_input.output.address.payment_credential
    
    expect [Pair(asset_name, amount)] = 
      mint
        |> assets.tokens(policy_id)
        |> dict.to_pairs()
    
    amount == -1 && asset_name == token_name
  }

  mint(rdmr: Action, policy_id: PolicyId, transaction: Transaction) -> Bool {
    let Transaction { inputs, mint, outputs, .. } = transaction

    expect [Pair(asset_name, amount)] = 
      mint
        |> assets.tokens(policy_id)
        |> dict.to_pairs()

    when rdmr is {
      CheckMint -> {
        expect True = list.any(inputs, fn(input) { input.output_reference == utxo_ref })
        let valid_mint = amount == 1 && asset_name == token_name
        let event_name = "Test Event"
        let event_url = "https://example.com/event1"
        let event_image = "https://example.com/event1.jpg"
        let event_date = "2025-03-01"
        let creator: VerificationKeyHash = #[0x01, 0x02, 0x03]  
        let metadata = EventNFT {
          url: event_url,
          event_name: event_name,
          image: event_image,
          date: event_date,
          author: creator
        }

        let datum = InlineDatum(metadata)
        let new_output = (outputs, [(policy_id, [(asset_name, 1)])], Some(datum), None)
        True 
      }

      CheckBurn -> {
        amount == -1 && asset_name == token_name
      }
    }
  }
}