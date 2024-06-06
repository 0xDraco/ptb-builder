"use client"

import {Input} from "@/components/ui/input";
import {useState} from "react";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";
import {
    SuiClient,
    SuiMoveAbilitySet,
    SuiMoveNormalizedFunction,
    SuiMoveNormalizedModules,
    SuiMoveNormalizedType,
} from "@mysten/sui/client";
import {Label} from "@/components/ui/label";
import {Button} from "@/components/ui/button";
import {ChevronDown, ChevronUp, PlusIcon, SaveIcon, SettingsIcon, TrashIcon} from "lucide-react";
import {Dialog, DialogContent, DialogHeader, DialogTitle} from "@/components/ui/dialog";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import Link from "next/link";

type TransactionKind = "MoveCall" | "SplitCoins" | "MergeCoins" | "MakeMoveVec" | "TransferObjects";

const transactions: Record<any, { title: string, description: string }> = {
    MoveCall: {title: "Move Call", description: "Call an onchain move function"},
    SplitCoins: {title: "Split Coins", description: "Split a coin into multiple smaller ones"},
    MergeCoins: {title: "Merge Coins", description: "Merge multiple small coins into a bigger one"},
    MakeMoveVec: {title: "Make Move Vec", description: "Build a vector of Move elements"},
    TransferObjects: {title: "Transfer Objects", description: "Transfer objects to an address"},
}

interface MoveCallTransaction {
    module: string
    function: string
    kind: "MoveCall"
    packageId: string
    typeArguments: { value: string, moveTySet: SuiMoveAbilitySet }[]
    functionArguments: CallArgument[]
}

interface SplitCoinsTransaction {
    kind: "SplitCoins"
    coin: CallArgument
    amounts: CallArgument[]
}

interface MergeCoinsTransaction {
    kind: "MergeCoins"
    sources: CallArgument[]
    destination: CallArgument
}

interface TransferObjectsTransaction {
    kind: "TransferObjects"
    address: CallArgument
    objects: CallArgument[]
}

interface MakeMoveVecTransaction {
    type?: string
    elements: string[]
    kind: "MakeMoveVec"
}

type TransactionCombo =
    MoveCallTransaction
    | SplitCoinsTransaction
    | MergeCoinsTransaction
    | MakeMoveVecTransaction
    | TransferObjectsTransaction;

type CallArgumentType = "Object" | "Pure" | "Gas" | "Result" | "NestedResult"

interface CallArgument {
    value: string[] | null
    type: CallArgumentType,
    moveTypeName?: SuiMoveNormalizedType
}

const client = new SuiClient({url: "https://sui-testnet.nodeinfra.com:443?apikey=hackathon"})


export default function New() {
    const [modal, setModal] = useState(false)
    const [transactions, setTransactions] = useState<TransactionCombo[]>([])

    const handleTransactionSelect = (kind: TransactionKind) => {
        let transaction: TransactionCombo
        switch (kind) {
            case "MoveCall":
                transaction = {
                    kind: "MoveCall",
                    packageId: "",
                    typeArguments: [],
                    functionArguments: [],
                    function: '',
                    module: ''
                }
                break
            case "SplitCoins":
                transaction = {
                    kind: "SplitCoins",
                    coin: {value: [], type: "Object"},
                    amounts: [{value: [], type: "Pure"}]
                }
                break
            case "MergeCoins":
                transaction = {
                    kind: "MergeCoins",
                    sources: [{value: [], type: "Object"}],
                    destination: {value: [], type: "Object"}
                }
                break
            case "TransferObjects":
                transaction = {
                    kind: "TransferObjects",
                    objects: [{value: [], type: "Object"}],
                    address: {value: [], type: "Pure"}
                }
                break
            case "MakeMoveVec":
                transaction = {kind: "MakeMoveVec", elements: [], type: ""}
                break
            default:
                throw new Error("Unsupported or Unknown transaction kind")
        }

        setTransactions((transactions) => [...transactions, transaction])
    }

    const updateTransactionByIndex = (transaction: TransactionCombo, index: number) => {
        setTransactions((transactions) => transactions.map((tx, i) => i === index ? {...tx, ...transaction} : tx))
    }

    return (
        <>
            <div className="container mt-12 w-1/2 mx-auto">
                <div className="mb-10 pb-3 border-b flex justify-between items-center">
                    <div className="text-2xl font-bold">PTB Builderrrr</div>

                    <div className="text-muted-foreground text-sm">
                        <Link href={"/"}>Saved Builds</Link>
                    </div>
                </div>


                <div className="mb-3 pb-5 border-b">
                    <div className="mb-3">
                        <Input placeholder="Transaction title"/>
                    </div>

                    <div className="flex gap-3">
                        <Button variant="secondary" className="w-full text-sm font-normal">Simulate</Button>
                        <Button className="w-full text-sm font-normal">Execute</Button>
                    </div>
                </div>

                <div className="flex gap-3 justify-end mb-5">
                    <Button variant="secondary" size="sm">
                        <SaveIcon size={20}/>
                    </Button>

                    <Button variant="secondary" size="sm">
                        <SettingsIcon size={20}/>
                    </Button>

                    <Button onClick={() => setModal(true)} variant="secondary" className="flex gap-2" size="sm">
                        <PlusIcon size={15}/>
                        <div className="text-sm font-normal">Add Transaction</div>
                    </Button>
                </div>

                {transactions.map((transaction, i) => <TransactionCard update={updateTransactionByIndex} index={i}
                                                                       key={i} transaction={transaction}/>)}
            </div>

            <SelectTransactionModal open={modal} setOpen={setModal} onSelectTransaction={handleTransactionSelect}/>
        </>
    )
}

const TransactionCard = ({transaction, index, update}: {
    update: (tx: TransactionCombo, i: number) => void,
    transaction: TransactionCombo,
    index: number
}) => {
    const [expanded, setExpanded] = useState(true)

    return (
        <Card className="mt-3">
            <CardHeader className="py-3">
                <CardTitle className="font-normal text-sm flex justify-between items-center">
                    Transaction {index} ({transactions[transaction.kind].title})

                    <div className="cursor-pointer" onClick={() => setExpanded((v) => !v)}>
                        {expanded ? <ChevronUp/> : <ChevronDown/>}
                    </div>
                </CardTitle>
            </CardHeader>

            {expanded &&
                <>
                    <div className="border-b w-full mb-5"/>
                    <CardContent>
                        <RenderTransaction update={update} transaction={transaction} index={index}/>
                    </CardContent>
                </>
            }
        </Card>
    )
}

const RenderTransaction = ({transaction, index, update}: {
    update: (tx: TransactionCombo, i: number) => void,
    transaction: TransactionCombo,
    index: number
}) => {
    switch (transaction.kind) {
        case "MoveCall":
            return <MoveCallBuild client={client} index={index} transaction={transaction} update={update}/>
        case "SplitCoins":
            return <SplitCoinsBuild index={index} transaction={transaction} update={update}/>
        case "MergeCoins":
            return <MergeCoinsBuild index={index} transaction={transaction} update={update}/>
        case "MakeMoveVec":
            return <MakeMoveVecBuild index={index} transaction={transaction} update={update}/>
        case "TransferObjects":
            return <TransferObjectsBuild index={index} transaction={transaction} update={update}/>
    }
}

function MergeCoinsBuild({transaction, index, update}: {
    transaction: MergeCoinsTransaction,
    index: number,
    update: (tx: TransactionCombo, i: number) => void
}) {
    const handleSetDestinationValueType = (type: CallArgumentType) => {
        const tx = {
            ...transaction,
            destination: {
                ...transaction.destination,
                type
            }
        }

        update(tx, index)
    }

    const handleSetDestinationValueValue = (value: string[] | null) => {
        const tx = {
            ...transaction,
            destination: {
                ...transaction.destination,
                value
            }
        }
        update(tx, index)

    }


    const handleSetSourceValueType = (type: CallArgumentType, si: number) => {
        const sources = transaction.sources.map((tx, i) => (i == si) ? {...tx, type} : tx)
        update({...transaction, sources}, index)
    }

    const handleSetSourceValueValue = (value: string[] | null, si: number) => {
        const sources = transaction.sources.map((tx, i) => (i == si) ? {...tx, value} : tx)
        update({...transaction, sources}, index)
    }

    return (
        <>
            <div className="mb-5">
                <div className="text-sm mb-3">Destination Coin</div>
                <CallArgBuild
                    value={transaction.destination}
                    setValueType={handleSetDestinationValueType}
                    setValueValue={handleSetDestinationValueValue}
                />
            </div>

            <div>
                <div className="text-sm mb-3">Source Coins</div>
                {
                    transaction.sources.map((source, i) =>
                        <CallArgBuild
                            key={i}
                            value={source}
                            setValueType={(type) => handleSetSourceValueType(type, i)}
                            setValueValue={(value) => handleSetSourceValueValue(value, i)}/>
                    )
                }
            </div>

            <div className="flex justify-end">
                <Button onClick={() => {
                    update({
                        ...transaction,
                        sources: [...transaction.sources, {type: "Object", value: [""]}]
                    }, index)
                }} variant="secondary" className="flex gap-2" size="sm">
                    <PlusIcon size={15}/>
                    <div className="text-sm">Add Source</div>
                </Button>
            </div>
        </>
    )
}

function TransferObjectsBuild({transaction, index, update}: {
    transaction: TransferObjectsTransaction,
    index: number,
    update: (tx: TransactionCombo, i: number) => void
}) {
    const handleSetRecipientValueType = (type: CallArgumentType) => {
        const tx = {
            ...transaction,
            address: {
                ...transaction.address,
                type
            }
        }

        update(tx, index)
    }

    const handleSetRecipientValueValue = (value: string[] | null) => {
        const tx = {
            ...transaction,
            address: {
                ...transaction.address,
                value
            }
        }

        update(tx, index)
    }


    const handleSetObjectValueType = (type: CallArgumentType, si: number) => {
        const objects = transaction.objects.map((tx, i) => (i == si) ? {...tx, type} : tx)
        update({...transaction, objects}, index)
    }

    const handleSetObjectValueValue = (value: string[] | null, si: number) => {
        const objects = transaction.objects.map((tx, i) => (i == si) ? {...tx, value} : tx)
        update({...transaction, objects}, index)
    }

    return (
        <>
            <div className="mb-5">
                <div className="text-sm mb-3">Address</div>
                <CallArgBuild
                    value={transaction.address}
                    setValueType={handleSetRecipientValueType}
                    setValueValue={handleSetRecipientValueValue}
                />
            </div>

            <div>
                <div className="text-sm mb-3">Objects</div>
                {
                    transaction.objects.map((object, i) =>
                        <CallArgBuild
                            key={i}
                            value={object}
                            setValueType={(type) => handleSetObjectValueType(type, i)}
                            setValueValue={(value) => handleSetObjectValueValue(value, i)}/>
                    )
                }
            </div>

            <div className="flex justify-end">
                <Button onClick={() => {
                    update({
                        ...transaction,
                        objects: [...transaction.objects, {type: "Object", value: [""]}]
                    }, index)
                }} variant="secondary" className="flex gap-2" size="sm">
                    <PlusIcon size={15}/>
                    <div className="text-sm">Add Object</div>
                </Button>
            </div>
        </>
    )
}

function MakeMoveVecBuild({transaction, index, update}: {
    transaction: MakeMoveVecTransaction,
    index: number,
    update: (tx: TransactionCombo, i: number) => void
}) {
    const handleTypeChange = (type: string) => {
        const tx = {
            ...transaction,
            type
        }

        update(tx, index)
    }

    const handleElementChange = (value: string, si: number) => {
        const elements = transaction.elements.map((elem, i) => (i == si) ? value : elem)
        update({...transaction, elements}, index)
    }

    return (
        <>
            <div className="mb-5">
                <div className="text-sm mb-3">Elements Type</div>
                <Input
                    value={transaction.type}
                    onChange={(e) => handleTypeChange(e.target.value)}
                />
            </div>

            <div>
                <div className="text-sm mb-3">Elements</div>
                {
                    transaction.elements
                        .map((element, i) => <Input
                                key={i}
                                value={element}
                                onChange={(e) => handleElementChange(e.target.value, i)}
                            />
                        )
                }
            </div>

            <div className="flex justify-end">
                <Button onClick={() => {
                    update({...transaction, elements: [...transaction.elements, ""]}, index)
                }} variant="secondary" className="flex gap-2" size="sm">
                    <PlusIcon size={15}/>
                    <div className="text-sm">Add Element</div>
                </Button>
            </div>
        </>
    )
}


function SplitCoinsBuild({transaction, index, update}: {
    transaction: SplitCoinsTransaction,
    index: number,
    update: (tx: TransactionCombo, i: number) => void
}) {
    const handleSetCoinValueType = (type: CallArgumentType) => {
        const tx = {
            ...transaction,
            coin: {
                ...transaction.coin,
                type
            }
        }

        update(tx, index)
    }

    const handleSetCoinValueValue = (value: string[] | null) => {
        const tx = {
            ...transaction,
            coin: {
                ...transaction.coin,
                value
            }
        }
        update(tx, index)

    }


    const handleSetAmountValueType = (type: CallArgumentType, si: number) => {
        const amounts = transaction.amounts.map((tx, i) => (i == si) ? {...tx, type} : tx)
        update({...transaction, amounts}, index)
    }

    const handleSetAmountValueValue = (value: string[] | null, si: number) => {
        const amounts = transaction.amounts.map((tx, i) => (i == si) ? {...tx, value} : tx)
        update({...transaction, amounts}, index)
    }

    return (
        <>
            <div className="mb-5">
                <div className="text-sm mb-3">Coin</div>
                <CallArgBuild
                    value={transaction.coin}
                    setValueType={handleSetCoinValueType}
                    setValueValue={handleSetCoinValueValue}
                />
            </div>

            <div>
                <div className="text-sm mb-3">Split Amounts</div>
                {
                    transaction.amounts.map((amount, i) =>
                        <CallArgBuild
                            key={i}
                            value={amount}
                            setValueType={(type) => handleSetAmountValueType(type, i)}
                            setValueValue={(value) => handleSetAmountValueValue(value, i)}/>
                    )
                }
            </div>

            <div className="flex justify-end">
                <Button onClick={() => {
                    update({
                        ...transaction,
                        amounts: [...transaction.amounts, {type: "Pure", value: [""]}]
                    }, index)
                }} variant="secondary" className="flex gap-2" size="sm">
                    <PlusIcon size={15}/>
                    <div className="text-sm">Add Amount</div>
                </Button>
            </div>
        </>
    )
}


function MoveCallBuild({client, transaction, index, update}: {
    client: SuiClient,
    transaction: MoveCallTransaction,
    index: number,
    update: (tx: TransactionCombo, i: number) => void
}) {
    const [modules, setModules] = useState<SuiMoveNormalizedModules>({});
    const [functions, setFunctions] = useState<(SuiMoveNormalizedFunction & { name: string })[]>([])
    const [results, setResults] = useState<SuiMoveNormalizedType[]>([])

    const onPackageIdChange = async (value: string) => {
        const modules = await client.getNormalizedMoveModulesByPackage({package: value})
        const tx = {
            ...transaction,
            packageId: value
        }

        update(tx, index)
        console.log(modules)
        setModules(modules)
    }

    const onModuleNameChange = (value: string) => {
        const mod = modules[value];
        if (!mod) return

        const functions = Object.entries(mod.exposedFunctions)
            .filter(([_, definition]) => definition.visibility === "Public")
            .map(([name, definition]) => ({name, ...definition}))

        const tx = {
            ...transaction,
            module: value
        }

        update(tx, index)
        setFunctions(functions)
    }

    const onFunctionNameChange = (value: string) => {
        const func = functions.find(func => func.name === value)
        if (!func) return

        const tx = {
            ...transaction,
            function: value,
            typeArguments: func.typeParameters.map((ty) => ({value: "", moveTySet: ty})),
            functionArguments: func.parameters.filter((p) => makeFullTypeName(p) != "MutableReference(0x2::tx_context::TxContext)" && makeFullTypeName(p) !== "Reference(0x2::tx_context::TxContext)")
                .map((ty) => ({
                    value: [],
                    moveTypeName: ty,
                    type: getLiteralValueKind(ty),
                })),
        }

        update(tx, index)
        setResults(func.return)
    }

    const handleSetCallArgBuildValueType = (type: CallArgumentType, si: number) => {
        const functionArguments = transaction.functionArguments.map((tx, i) => (i == si) ? {...tx, type} : tx)
        update({...transaction, functionArguments}, index)
    }

    const handleSetCallArgBuildValueValue = (value: string[] | null, si: number) => {
        const functionArguments = transaction.functionArguments.map((tx, i) => (i == si) ? {...tx, value} : tx)
        update({...transaction, functionArguments}, index)
    }

    const handleTypeChange = (type: string, ti: number) => {
        const tx = {
            ...transaction,
            typeArguments: transaction.typeArguments.map((ty, i) => i == ti ? {...ty, value: type} : ty)
        }

        update(tx, index)
    }


    return (
        <div>
            <div className="">
                <div className="w-full mb-3">
                    <div className="text-sm mb-3">Package ID</div>
                    <Input
                        className=""
                        placeholder="Package ID"
                        onChange={(e) => onPackageIdChange(e.target.value)}
                    />
                </div>
                <div className="flex gap-3 mb-3">
                    <div className="w-full">
                        <div className="text-sm mb-3">Module</div>
                        <Select onValueChange={onModuleNameChange}>
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="Select Module"/>
                            </SelectTrigger>
                            <SelectContent>
                                {
                                    Object.keys(modules ?? {})
                                        .map((module, i) => <SelectItem key={i} value={module}>{module}</SelectItem>)
                                }
                            </SelectContent>
                        </Select>

                    </div>

                    <div className="w-full">
                        <div className="text-sm mb-3">Function</div>
                        <Select onValueChange={onFunctionNameChange}>
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="Select Function"/>
                            </SelectTrigger>
                            <SelectContent>
                                {
                                    functions
                                        .map((func, i) => <SelectItem key={i}
                                                                      value={func.name}>{func.name}</SelectItem>)
                                }
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div className="mb-3 mt-5">
                    {transaction.typeArguments.length != 0 &&
                        <>
                            <div className="mb-3 flex justify-between item-center gap-3">
                                <div className="text-sm">Type Arguments</div>
                                <div className="border-b flex-1"/>
                            </div>

                            {
                                transaction.typeArguments.map((ty, i) =>
                                    <TypeArg
                                        onTypeValue={handleTypeChange}
                                        ty={ty}
                                        index={i}
                                        key={i}
                                    />
                                )
                            }
                        </>
                    }
                </div>

                <div className="my-5">
                    {transaction.functionArguments.length != 0 &&
                        <>
                            <div className="mb-3 flex justify-between item-center gap-3 w-full">
                                <div className="text-sm">Function Arguments</div>
                                <div className="border-b flex-1"/>
                            </div>

                            {
                                transaction.functionArguments.map((funcArg, i) =>
                                    <CallArgBuild
                                        key={i}
                                        value={funcArg}
                                        setValueType={(type) => handleSetCallArgBuildValueType(type, i)}
                                        setValueValue={(value) => handleSetCallArgBuildValueValue(value, i)}/>
                                )
                            }
                        </>}
                </div>
            </div>

            <div className="text-sm mb-2">Returns:</div>
            {
                results.map((result, i) => (
                        <div key={i} className="text-sm mb-2 flex gap-3 justify-between">
                            <div>{i}</div>
                            <div className="text-muted-foreground text-sm">{makeFullTypeName(result)}</div>
                        </div>
                    )
                )
            }
        </div>
    )
}

const CallArgBuild = ({value, setValueType, setValueValue}: {
    value: CallArgument
    setValueType: (type: CallArgumentType) => void
    setValueValue: (type: string[] | null) => void
}) => {
    return (
        <>
            {value.moveTypeName &&
                <div className="text-xs text-muted-foreground mb-1">{makeFullTypeName(value.moveTypeName)}</div>}
            <div className="flex gap-3 mb-3">
                <div className="w-full">
                    <Select defaultValue={value.type} onValueChange={(v) => setValueType(v as CallArgumentType)}>
                        <SelectTrigger className="w-full">
                            <SelectValue defaultValue={"literal"} placeholder="Select Value Type"/>
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value={"Pure"}>Pure Input</SelectItem>
                            <SelectItem value={"Object"}>Object Input</SelectItem>
                            <SelectItem value={"Gas"}>Gas Coin</SelectItem>
                            <SelectItem value={"Result"}>Result</SelectItem>
                            <SelectItem value={"NestedResult"}>Nested Result</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {value.type !== "Gas" &&
                    <div className="w-full">
                        <div className="flex gap-3">
                            <Input
                                className="w-full"
                                value={value.value?.[0]}
                                onChange={(e) => setValueValue([e.target.value, value.value?.[1] ?? ""])}
                                placeholder={value.type == "Object" || value.type == "Pure" ? "Value" : "Result Index"}
                            />

                            {
                                value.type == "NestedResult" &&
                                <Input
                                    value={value.value?.[1]}
                                    className="w-full" placeholder="Nested Result Index"
                                    onChange={(e) => setValueValue([value.value?.[0] ?? "", e.target.value])}
                                />
                            }
                        </div>
                        <div
                            className="flex justify-end items-center text-xs gap-2 mt-2 mb-0 text-muted-foreground cursor-pointer">
                            {value.type == "Object" && <div>Select Object</div>}
                            {value.type == "Object" && <div><TrashIcon size={12} className=""/></div>}
                        </div>
                    </div>
                }

            </div>
        </>
    )
}

const TypeArg = ({ty, index, onTypeValue}: {
    onTypeValue: (ty: string, i: number) => void,
    ty: { value: string, moveTySet: SuiMoveAbilitySet },
    index: number
}) => {
    return (
        <div className="mt-3">
            <Label className="mb-2 text-sm flex gap-2 items-center">
                <div>Type{index}</div>
                {
                    ty.moveTySet?.abilities.length !== 0 &&
                    <div className="text-xs text-muted-foreground">
                        (Abilities: {ty.moveTySet.abilities.join(", ")})
                    </div>
                }
            </Label>
            <Input
                className="w-full"
                placeholder={`Type ${index}`}
                onChange={(e) => onTypeValue(e.target.value, index)}
            />
        </div>
    )
}
const makeFullTypeName = (param: SuiMoveNormalizedType): string => {
    if (typeof param != 'object') return String(param)

    if ('Struct' in param) {
        const {Struct: {name, address, module, typeArguments}} = param
        const mainType = `${address}::${module}::${name}`;
        return typeArguments.length === 0 ? mainType : `${mainType}<${typeArguments.map(ty => makeFullTypeName(ty)).join(", ")}>`
    }

    if ('Vector' in param) {
        return `Vector(${makeFullTypeName(param.Vector)})`
    }

    if ('Reference' in param) {
        return `Reference(${makeFullTypeName(param.Reference)})`
    }

    if ('MutableReference' in param) {
        return `MutableReference(${makeFullTypeName(param.MutableReference)})`
    }

    return `TypeParameter(Type${param.TypeParameter})`
}

const SelectTransactionModal = ({open, setOpen, onSelectTransaction}: {
    open: boolean,
    setOpen: (open: boolean) => void,
    onSelectTransaction: (kind: TransactionKind) => void
}) => {
    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="w-[90%] md:max-w-screen-sm">
                <DialogHeader className="pb-5 border-b">
                    <DialogTitle>Add Transaction</DialogTitle>
                </DialogHeader>

                <div className="mt-3">
                    <div className="text-sm mb-3">Select the type of transaction you want to add below</div>

                    {Object.entries(transactions).map(([kind, {title, description}], i) => {
                        return (
                            <div
                                key={i}
                                onClick={() => {
                                    onSelectTransaction(kind as TransactionKind)
                                    setOpen(false)
                                }}
                                className="cursor-pointer mb-3 hover:bg-secondary p-3 border rounded-md">
                                <div className="text-base mb-1">{title}</div>
                                <div className='text-xs text-muted-foreground'>{description}</div>
                            </div>
                        )
                    })}
                </div>
            </DialogContent>
        </Dialog>
    )
}

const getLiteralValueKind = (type: SuiMoveNormalizedType): "Object" | "Pure" => {
    return typeof type !== "object" ? "Pure" : 'Vector' in type ? getLiteralValueKind(type.Vector) : "Object"
}
