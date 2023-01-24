import Head from 'next/head'
import { Layout } from "../components/Layout/Layout"
import { Heading, Flex, Text, Textarea, Input, Button, useToast, Alert, AlertIcon } from '@chakra-ui/react'
import { useState, useEffect } from 'react'
import { useAccount, useProvider, useSigner } from 'wagmi'
import Contract from "../../backend/artifacts/contracts/Job.sol/Jobs.json"
import { ethers } from 'ethers'
import { Job } from '../components/Job/Job'

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

    //For each event, we put it in the right array
    events.forEach(event => {
      if(event.event === "jobAdded") {
        jobAddedEvents.push(event.args)
      }
      else if(event.event === "jobTaken") {
        jobTakenEvents.push(event.args)
      }
      else {
        jobPaidEvents.push(event.args)
      }
    })

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

  //The user wants to take a job
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

  //The user wants to pay a job
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
          flexWrap="wrap"
        >
          {events.length !== 0 ? (
            events.map(event => {
              return (
                <Job event={event} takeJob={takeJob} payJob={payJob} />
              )
            })
          ) : (
            <Flex height="100%" width="100%" alignItems="center" justifyContent="center">
              <Alert status='warning' width="300px">
                <AlertIcon />
                <Flex direction="column">
                  <Text as='span'>There are no jobs on our DApp.</Text>
                  <Text><Link href="addajob" style={{"fontWeight": "bold"}}>Create the first job!</Link></Text>
                </Flex>
              </Alert>
            </Flex>
          )}
        </Flex>
      </Layout>
    </>
  )
}
