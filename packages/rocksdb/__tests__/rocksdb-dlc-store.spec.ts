// tslint:disable: no-unused-expression

import { OfferDlcV0, AcceptDlcV0, SignDlcV0 } from "@node-dlc/messaging"
import { expect } from "chai";
import { RocksdbDlcStore } from "../lib/rocksdb-dlc-store";
import { sha256 } from "@liquality/crypto"
import * as util from "./rocksdb";
import * as cfdDlcJs from 'cfd-dlc-js'

describe("RocksdbGossipStore", () => {
  let sut: RocksdbDlcStore;

  const offerDlcHex = Buffer.from(
    "a71a" + // type
    "00" + // contract_flags
    "06226e46111a0b59caaf126043eb5bbf28c34f3a5e332a1fc7b2b73cf188910f" + // chain_hash

    "fdd82e" + // type contract_info
    "fd0131" + // length
    "000000000bebc200" + // total_collateral
    "fda710" + // type contract_descriptor
    "79" + // length
    "03" + // num_outcomes
    "c5a7affd51901bc7a51829b320d588dc7af0ad1f3d56f20a1d3c60c9ba7c6722" + // outcome_1
    "0000000000000000" + // payout_1
    "adf1c23fbeed6611efa5caa0e9ed4c440c450a18bc010a6c867e05873ac08ead" + // outcome_2
    "00000000092363a3" + // payout_2
    "6922250552ad6bb10ab3ddd6981b530aa9a6fd05725bf85b59e3e51163905288" + // outcome_3
    "000000000bebc200" + // payout_3
    "fda712" + // type oracle_info
    "a8" + // length
    "fdd824" + // type oracle_announcement
    "a4" + // length
    "fab22628f6e2602e1671c286a2f63a9246794008627a1749639217f4214cb4a9" + // announcement_signature_r
    "494c93d1a852221080f44f697adb4355df59eb339f6ba0f9b01ba661a8b108d4" + // announcement_signature_s
    "da078bbb1d34e7729e38e2ae34236e776da121af442626fa31e31ae55a279a0b" + // oracle_public_key
    "fdd822" + // type oracle_event
    "40" + // length
    "0001" + // nb_nonces
    "3cfba011378411b20a5ab773cb95daab93e9bcd1e4cce44986a7dda84e01841b" + // oracle_nonces
    "00000000" + // event_maturity_epoch
    "fdd806" + // type enum_event_descriptor
    "10" + // length
    "0002" + // num_outcomes
    "06" + // outcome_1_len
    "64756d6d7931" + // outcome_1
    "06" + // outcome_2_len
    "64756d6d7932" + // outcome_2
    "05" + // event_id_length
    "64756d6d79" + // event_id

    "0327efea09ff4dfb13230e887cbab8821d5cc249c7ff28668c6633ff9f4b4c08e3" + // funding_pubkey

    "0016" + // payout_spk_len
    "00142bbdec425007dc360523b0294d2c64d2213af498" + // payout_spk

    "0000000005f5e100" + // total_collateral_satoshis

    "0001" + // funding_inputs_len
    
    "fda714" + // type funding_input
    "3f" + // length
    "000000000000fa51" + // input_serial_id
    "0029" + // prevtx_len
    "02000000000100c2eb0b00000000160014369d63a82ed846f4d47ad55045e594ab95539d6000000000" + // prevtx
    "00000000" + // prevtx_vout
    "ffffffff" + // sequence
    "006b" + // max_witness_len
    "0000" + // redeemscript_len

    "0016" + // change_spk_len
    "0014afa16f949f3055f38bd3a73312bed00b61558884" + // change_spk

    "0000000000000001" + // fee_rate

    "00000064" + // contract_maturity_bound
    "000000c8" // contract_timeout
    , "hex"
  ); // prettier-ignore

  const offerDlc = OfferDlcV0.deserialize(offerDlcHex);

  const acceptDlcHex = Buffer.from(
    "a71c" + // type accept_dlc_v0
    "960fb5f7960382ac7e76f3e24eb6b00059b1e68632a946843c22e1f65fdf216a" + // temp_contract_id
    "0000000005f5e100" + // total_collateral_satoshis
    "026d8bec9093f96ccc42de166cb9a6c576c95fc24ee16b10e87c3baaa4e49684d9" + // funding_pubkey
    "0016" + // payout_spk_len
    "001436054fa379f7564b5e458371db643666365c8fb3" + // payout_spk
    "0001" + // funding_inputs_len
    "fda714" + // type funding_input_v0
    "3f" + // length
    "000000000000dae8" + // input_serial_id
    "0029" + // prevtx_len
    "02000000000100c2eb0b000000001600149ea3bf2d6eb9c2ffa35e36f41e117403ed7fafe900000000" + // prevtx
    "00000000" + // prevtx_vout
    "ffffffff" + // sequence
    "006b" + // max_witness_len
    "0000" + // redeem_script_len
    "0016" + // change_spk_len
    "0014074c82dbe058212905bacc61814456b7415012ed" + // change_spk
    "fda716" + // type cet_adaptor_signatures_v0
    "fd01e7" + // length
    "03" + // nb_signatures
    "016292f1b5c67b675aea69c95ec81e8462ab5bb9b7a01f810f6d1a7d1d886893b3605fe7fcb75a14b1b1de917917d37e9efac6437d7a080da53fb6dbbcfbfbe7a8" + // ecdsa_adaptor_signature_1
    "01efbecb2bce89556e1fb4d31622628830e02a6d04c487f67aca20e9f60fb127f985293541cd14e2bf04e4777d50953531e169dd37c65eb3cc17d6b5e4dbe58487f9fae1f68f603fe014a699a346b14a63048c26c9b31236d83a7e369a2b29a292" + // dleq_proof_1
    "00e52fe05d832bcce4538d9c27f3537a0f2086b265b6498f30cf667f77ff2fa87606574bc9a915ef57f7546ebb6852a490ad0547bdc52b19791d2d0f0cc0acabab" + // ecdsa_adaptor_signature_2
    "01f32459001a28850fa8ee4278111deb0494a8175f02e31a1c18b39bd82ec64026a6f341bcd5ba169d67b855030e36bdc65feecc0397a07d3bc514da69811ec5485f5553aebda782bc5ac9b47e8e11d701a38ef2c2b7d8af3906dd8dfc759754ce" + // dleq_proof_2
    "006f769592c744141a5ddface6e98f756a9df1bb75ad41508ea013bdfee133b396d85be51f870bf2e0ae836bfa984109dab96cc6f4ab2a7f118bc6b0b25a4c70d4" + // ecdsa_adaptor_signature_3
    "01c768c1d677c6ff0b7ea69fdf29aff1000794227db368dff16e838d1f44c4afe9e952ee63d603f7b14de13c1d73b363cc2b1740d0b688e73d8e71cddf40f8e7e912df413903779c4e5d6644c504c8609baec8fdcb90d6d341cf316748f5d7945f" +
    "7c8ad6de287b62a1ed1d74ed9116a5158abc7f97376d201caa88e0f9daad68fcda4c271cc003512e768f403a57e5242bd1f6aa1750d7f3597598094a43b1c7bb" + // refund_signature
    "fdd82600" // negotiation_fields
    , "hex"
  ); // prettier-ignore

  const acceptDlc = AcceptDlcV0.deserialize(acceptDlcHex);

  const contractId = Buffer.from('c1c79e1e9e2fa2840b2514902ea244f39eb3001a4037a52ea43c797d4f841269', 'hex')

  const signDlcHex = Buffer.from(
    "a71e" + // sign_dlc_v0
    contractId.toString('hex') + // contract_id
    "fda716" + // type cet_adaptor_signatures_v0
    "fd01e7" + // length
    "03" + // nb_signatures
    "00c706fe7ed70197a77397fb7ce8445fcf1d0b239b4ab41ebdad4f76e0a671d7830470f4fef96d0838e8f3cec33176a6a427d777b57d256f8545b570cd70297291" + // ecdsa_adaptor_signature_1
    "0192f8ad4eb341ac2867d203360516028b967b46ef0e5d1603b59a7d8ebc81d655dd11673febcf098006eba74b3604d0a1da818208ea2833079505a3dee7392255f0682e5b357a7382aae6e5bdcc728b94c9d0a52fb6f49ac5cbe32804fcfb71b1" + // dleq_proof_1
    "0125e92381be588737f6ac5c28325c843c6551995880f830d926abd35ee3f8ed9fdfc47a5fd277d0df2a1f1d0bafba8efad7b127e2a232a4846ed90810c81e6575" + // ecdsa_adaptor_signature_2
    "0039dba803adb78100f20ca12b09b68a92b996b07a5ee47806379cedfa217848644f48d96ed6443ea7143adf1ce19a4386d0841b5071e31f5d3e4c479eab6a856b426c80d091da3de3959b29e4c2e3ae47ddba2758c2ca1c6a064dfee4671ba501" + // dleq_proof_2
    "0098f2595778a1596054ffcafb599f8f4a65c4215de757548c142d50b12eb67d4c1407690b808e33eba95fe818223886fd8e9ce4c758b4662636af663e00553763" + // ecdsa_adaptor_signature_3
    "00a915ee71914ee8ae2c18d55b397649c0057a01f0a85c6ecf1b0eb26f7485f21b24c89013e1cb15a4bf40256e52a66751f33de46032db0801975933be2977a1e37d5d5f2d43f48481cc68783dbfeb21a35c62c1ca2eb6ee2ccfc12b74e9fd7a08" + // dleq_proof_3
    "fbf56fbb4bbcb01d1be3169dfda6f465020ee89c1e368d4a91e36d0d4cc44e6123db348c223988dfe147d611ae9351d6e78cfb902e3d01beed0c909e52a3aae9" + // refund_signature
    "fda718" + // type funding_signatures_v0
    "70" + // length
    "0001" + // num_witnesses
    "0002" + // stack_len
    "0047" + // stack_element_len
    "304402203812d7d194d44ec68f244cc3fd68507c563ec8c729fdfa3f4a79395b98abe84f0220704ab3f3ffd9c50c2488e59f90a90465fccc2d924d67a1e98a133676bf52f37201" + // stack_element
    "0021" + // stack_element_len
    "02dde41aa1f21671a2e28ad92155d2d66e0b5428de15d18db4cbcf216bf00de919" // stack_element
    , "hex"
  ); // prettier-ignore

  const signDlc = SignDlcV0.deserialize(signDlcHex);

  before(async () => {
    util.rmdir(".testdb");
    sut = new RocksdbDlcStore("./.testdb/nested/dir");
    await sut.open();
  });

  after(async () => {
    await sut.close();
    util.rmdir(".testdb");
  });

  describe("save dlc_offer", () => {
    it("should save dlc_offer", async () => {
      await sut.saveDlcOffer(offerDlc)
    })
  })

  describe("find dlc_offer by tempContractId", () => {
    it("should return the dlc_offer object", async () => {
      await sut.saveDlcOffer(offerDlc)
      const tempContractId = Buffer.from(sha256(offerDlcHex), 'hex')
      const actual = await sut.findDlcOffer(tempContractId)
      expect(actual).to.deep.equal(offerDlc)
    })
  })

  describe("delete dlc_offer", () => {
    it("should delete dlc_offer", async () => {
      await sut.saveDlcOffer(offerDlc)
      const tempContractId = Buffer.from(sha256(offerDlcHex), 'hex')

      await sut.deleteDlcOffer(tempContractId)

      const actual = await sut.findDlcOffer(tempContractId)
      expect(actual).to.be.undefined
    });
  })
});
