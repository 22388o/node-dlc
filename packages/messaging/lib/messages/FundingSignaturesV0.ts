import { BufferReader, BufferWriter } from '@node-lightning/bufio';
import { write } from 'fs';
import { Script } from 'vm';
import { MessageType } from '../MessageType';
import { readTlvs } from '../serialize/readTlvs';
import { IDlcMessage } from './DlcMessage';
import { ScriptWitnessV0 } from './ScriptWitnessV0';

/**
 * FundingSignatures V0 contains signatures of the funding transaction
 * and any necessary information linking the signatures to their inputs.
 */
export class FundingSignaturesV0 implements IDlcMessage {
  public static type = MessageType.FundingSignaturesV0;

  /**
   * Deserializes an funding_signatures_v0 message
   * @param buf
   */
  public static deserialize(buf: Buffer): FundingSignaturesV0 {
    const instance = new FundingSignaturesV0();
    const reader = new BufferReader(buf);

    reader.readBigSize(); // read type
    instance.length = reader.readBigSize();
    const numWitnesses = reader.readUInt16BE();

    for (let i = 0; i < numWitnesses; i++) {
      const numWitnessElements = reader.readUInt16BE();
      const witnessElements: ScriptWitnessV0[] = [];
      for (let j = 0; j < numWitnessElements; j++) {
        const witness = ScriptWitnessV0.getWitness(reader);
        witnessElements.push(ScriptWitnessV0.deserialize(witness));
      }
      instance.witnessElements.push(witnessElements);
    }

    return instance;
  }

  /**
   * The type for funding_signatures_v0 message. funding_signatures_v0 = 42776
   */
  public type = FundingSignaturesV0.type;

  public length: bigint;

  public witnessElements: ScriptWitnessV0[][] = [];

  /**
   * Serializes the funding_signatures_v0 message into a Buffer
   */
  public serialize(): Buffer {
    const writer = new BufferWriter();
    writer.writeBigSize(this.type);
    writer.writeBigSize(this.length);
    writer.writeUInt16BE(this.witnessElements.length);

    for (const witnessElements of this.witnessElements) {
      writer.writeUInt16BE(witnessElements.length);
      for (const witnessElement of witnessElements) {
        writer.writeBytes(witnessElement.serialize());
      }
    }

    return writer.toBuffer();
  }
}
