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

pub type QuestNFT {
  quest_name: ByteArray,
  description: ByteArray,
  reward: ByteArray,
  quest_id: ByteArray,
  author: VerificationKeyHash,
  twitter_username: ByteArray,
  discord_id: ByteArray,
  telegram_group_id: ByteArray,
  website_url: ByteArray
}

validator quest_nft(token_name: ByteArray, utxo_ref: OutputReference) {
  
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
        let quest_name = "Epic Quest"
        let quest_description = "Complete this epic quest to earn rare rewards!"
        let quest_reward = "1000 Gold"
        let quest_id = "quest_001" // Unique quest identifier
        let twitter_username = "@EpicQuest" // Twitter handle
        let discord_id = "EpicQuest#1234" // Discord ID
        let telegram_group_id = "@EpicQuestGroup" // Telegram group ID
        let website_url = "https://epicquest.example.com" // Quest website URL
        let creator: VerificationKeyHash = #[0x01, 0x02, 0x03]  

        let metadata = QuestNFT {
          quest_name: quest_name,
          description: quest_description,
          reward: quest_reward,
          quest_id: quest_id,
          author: creator,
          twitter_username: twitter_username,
          discord_id: discord_id,
          telegram_group_id: telegram_group_id,
          website_url: website_url
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