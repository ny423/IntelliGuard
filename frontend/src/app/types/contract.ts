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