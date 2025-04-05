// Define proper types for ABI items
export interface ContractInput {
    name: string;
    type: string;
    indexed?: boolean;
    components?: Array<ContractInput>;
    internalType?: string;
}

export interface ContractOutput {
    name: string;
    type: string;
    components?: Array<ContractOutput>;
    internalType?: string;
}

export interface ContractFunction {
    name: string;
    type: string;
    inputs: Array<ContractInput>;
    outputs?: Array<ContractOutput>;
    stateMutability?: string;
    constant?: boolean;
    payable?: boolean;
}

// Define the Etherscan ABI response interface
export interface EtherscanAbiItem {
    name?: string;
    type: string;
    inputs?: ContractInput[];
    outputs?: ContractOutput[];
    stateMutability?: string;
    constant?: boolean;
    payable?: boolean;
}

export interface EtherscanSourceCodeItem {
    ABI: string;
    ContractName: string;
    CompilerVersion: string;
    OptimizationUsed: string;
    SourceCode: string;
    [key: string]: unknown;
}

export interface EtherscanAbiResponse {
    status: string;
    message: string;
    result: EtherscanSourceCodeItem[] | string;
}

export interface CeloscanAbi {
    inputs: CeloscanAbiParams[];
    stateMutability?: StateMutability;
    type: ABIType;
    anonymous?: boolean;
    name?: string;
    outputs?: CeloscanAbiParams[];
}

export interface CeloscanAbiParams {
    internalType: InternalTypeEnum;
    name: string;
    type: InternalTypeEnum;
    indexed?: boolean;
}

export enum InternalTypeEnum {
    Address = "address",
    Bool = "bool",
    String = "string",
    Uint256 = "uint256",
    Uint8 = "uint8",
}

export enum StateMutability {
    Nonpayable = "nonpayable",
    View = "view",
}

export enum ABIType {
    Constructor = "constructor",
    Event = "event",
    Function = "function",
}

export function convertCeloscanToEtherscanAbi(celoscanAbi: CeloscanAbi): EtherscanAbiItem {
    return {
        name: celoscanAbi.name,
        type: celoscanAbi.type,
        inputs: celoscanAbi.inputs?.map(input => ({
            name: input.name,
            type: input.type,
            indexed: input.indexed,
            internalType: input.internalType
        })),
        outputs: celoscanAbi.outputs?.map(output => ({
            name: output.name,
            type: output.type,
            internalType: output.internalType
        })),
        stateMutability: celoscanAbi.stateMutability
    };
}
