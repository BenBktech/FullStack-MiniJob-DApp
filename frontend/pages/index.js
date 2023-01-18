import Head from 'next/head'
import Link from 'next/link'
import { Layout } from "../components/Layout/Layout"
import { Heading, Flex, Text, Textarea, Input, Button, useToast, Card, CardHeader, CardBody, CardFooter, Alert, AlertIcon } from '@chakra-ui/react'
import { useState, useEffect } from 'react'
import { useAccount, useProvider, useSigner } from 'wagmi'
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
  const [events, setEvents] = useState([])

  //We could put this in an .env file also
  const contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3"

  useEffect(() => {
    if(isConnected) {
      getEvents()
    }
  }, [])

  const getEvents = async() => {
    const contract = new ethers.Contract(contractAddress, Contract.abi, provider)

    //Get All the Events
    let filter = {
        address: contractAddress,
        fromBlock: 0
    };

    let events = await contract.queryFilter(filter)
    let allTheEvents = [], jobAddedEvents = [], jobTakenEvents = [], jobPaidEvents = [];
    //First, we need to get all the events, they are 3 types of events : jobAdded, jobTaken and jobFinished, so let's sort them first.
    for await (const event of events) {
        const txnReceipt = await event.getTransactionReceipt()
        let eventLog = txnReceipt.logs[0] 
        let log = contract.interface.parseLog(eventLog)
        if(log.eventFragment.name === "jobAdded") {
          jobAddedEvents.push(log.args)
        }
        else if(log.eventFragment.name === "jobTaken") {
          jobTakenEvents.push(log.args)
        }
        else {
          jobPaidEvents.push(log.args)
        }
    }

    //Then we need to iterate through the jobAdded events and if a job is taken or finished, we put these infos in a new object for this job
    let jobs = []
    jobAddedEvents.forEach(jobAdded => {
      let id = parseInt(jobAdded.id)
      //Job object
      let thisJob = {
        id: id,
        author: jobAdded.author,
        description: jobAdded.description,
        isTaken: false,
        isFinished: false
      }
      //Is the job taken ?
      jobTakenEvents.forEach(jobTaken => {
        if(id === parseInt(jobTaken.id)) {
          thisJob.isTaken = true
        }
      })
      //Is the job finished ?
      jobPaidEvents.forEach(jobPaid => {
        if(id === parseInt(jobPaid.id)) {
          thisJob.isFinished = true
        }
      })
      jobs.push(thisJob)
    })

    setEvents(jobs)
  }

  const takeJob = async(id) => {
    try {
      const contract = new ethers.Contract(contractAddress, Contract.abi, signer)
      let transaction = await contract.takeJob(id)
      await transaction.wait(1)
      getEvents()
      toast({
        title: 'Congratulations!',
        description: "You took a job!",
        status: 'success',
        duration: 5000,
        isClosable: true,
      })
    }
    catch {
      toast({
        title: 'Error',
        description: "An error occured, please try again.",
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
    }
    
  }

  const payJob = async(id) => {
    try {
      const contract = new ethers.Contract(contractAddress, Contract.abi, signer)
      let transaction = await contract.setIsFinishedAndPay(id)
      await transaction.wait(1)
      getEvents()
      toast({
        title: 'Congratulations!',
        description: "You paid the worker!",
        status: 'success',
        duration: 5000,
        isClosable: true,
      })
    }
    catch {
      toast({
        title: 'Error',
        description: "An error occured, please try again.",
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
    }
  }

  return (
    <>
      <Head>
        <title>Mini Job DApp : List of all the jobs</title>
        <meta name="description" content="A Mini Job Dapp where everyone can create a job, work and get paid!" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Layout>
        <Flex 
          width="100%" 
          direction={["column", "column", "row", "row"]} 
          alignItems={["center", "center", "flex-start", "flex-start"]}
          justifyContent={[]}
          flexWrap="wrap"
        >
          {events.length !== 0 ? (
            events.map(event => {
              return (
                <Card key={crypto.randomUUID()} mt={["1rem", "1rem", 0,0]} minWidth={["100%", "100%", "30%", "30%"]} ml="1%" mr="1%">
                  <CardBody>
                    <Text><Text as="span" fontWeight="bold">Author :</Text> {event.author.substring(0, 5)}...{event.author.substring(event.author.length - 4)}</Text>
                    <Text mt="1rem" mb="1rem"><Text as="span" fontWeight="bold">Description</Text> : {event.description}</Text>
                    {/* if the job is finished we display that the job is finished */}
                    {event.isFinished ? (
                      <Text color="red" fontWeight="bold">Job is finished.</Text>
                    ) : (
                      /* If the job is not finished, is the job already taken? */
                      event.isTaken ? (
                        /* If the job is taken, a button to pay the worker is displayed.
                        that you are the author of the job to display this button */
                        address === event.author ? (
                          <Button colorScheme="red" onClick={() => payJob(event.id)}>Pay</Button>
                        ) : (
                          /* Otherwise, it is displayed that the job is taken */
                          <Text color="green" fontWeight="bold">Job taken.</Text>
                        )
                      ) : (
                        /* if the job is not taken, a button is displayed to take the job, but it is necessary to check
                        that the connected address is not the one of the author of the job */
                        address !== event.author && (
                          <Button colorScheme="whatsapp" onClick={() => takeJob(event.id)}>Work</Button> 
                        )
                      )
                    )}                
                  </CardBody>
                </Card>
              )
            })
          ) : (
            <Flex height="100%" width="100%" alignItems="center" justifyContent="center">
              <Alert status='warning' width="300px">
                <AlertIcon />
                <Flex direction="column">
                  <Text as='span'>There are no jobs on our DApp.</Text>
                  <Text><Link href="addajob" style={{"font-weight": "bold"}}>Create the first job!</Link></Text>
                </Flex>
              </Alert>
            </Flex>
          )}
        </Flex>
      </Layout>
    </>
  )
}
