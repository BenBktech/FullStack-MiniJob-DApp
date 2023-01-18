import Head from 'next/head'
import Image from 'next/image'
import { Layout } from "../components/Layout/Layout"
import { Heading, Flex, Text, Textarea, Input, Button, useToast } from '@chakra-ui/react'
import { useState } from 'react'
import { useAccount, useProvider, useSigner } from 'wagmi'
import { useRouter } from 'next/router'
import Contract from "../../backend/artifacts/contracts/Job.sol/Jobs.json"
import { ethers } from 'ethers'

export default function Home() {
    //WAGMI
    const { address, isConnected } = useAccount()
    const provider = useProvider()
    const { data: signer } = useSigner()

    //CHAKRA-UI
    const toast = useToast()

    //STATES
    const [description, setDescription] = useState(null)
    const [price, setPrice] = useState(null)

    //ROUTER FOR REDIRECTION WITH NEXTJS
    const router = useRouter()

    //We could put this in an .env file also
    const contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3"

    const addAJob = async() => {
        try {
            const contract = new ethers.Contract(contractAddress, Contract.abi, signer)
            let transaction = await contract.addJob(description, {value: ethers.utils.parseEther(price)})
            await transaction.wait(1)
            toast({
                title: 'Congratulations!',
                description: "You have created a Job!",
                status: 'success',
                duration: 5000,
                isClosable: true,
            })
        }
        catch(error) {
            toast({
                title: 'Error',
                description: "An error occured, please try again.",
                status: 'error',
                duration: 5000,
                isClosable: true,
            })
            console.log(error)
        }
        router.push('/') 
    }

    return (
        <>
        <Head>
            <title>Mini Job DApp : Add a job</title>
            <meta name="description" content="A Mini Job Dapp where everyone can create a job, work and get paid!" />
            <meta name="viewport" content="width=device-width, initial-scale=1" />
            <link rel="icon" href="/favicon.ico" />
        </Head>
        <Layout>
            <Flex direction="column" alignItems="center" w="100%">
                <Heading as='h1' size='xl' noOfLines={1}>
                    Add a Job
                </Heading>
                <Flex mt="1rem" direction="column" width="100%">
                    <Text>Description :</Text>
                    <Textarea placeholder='The description of the job' onChange={e => setDescription(e.target.value)} />
                </Flex>
                <Flex mt="1rem" width="100%" direction="column">
                    <Text>Price :</Text>
                    <Input placeholder='How much you will pay your worker in ETH' onChange={e => setPrice(e.target.value)} />
                </Flex>
                <Button mt="1rem" colorScheme='whatsapp' width="100%" onClick={() => addAJob()}>Add</Button>
            </Flex>
        </Layout>
        </>
    )
}
