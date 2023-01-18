import { ConnectButton } from '@rainbow-me/rainbowkit';
import { Flex, Text } from '@chakra-ui/react'
import Link from 'next/link'

export const Header = () => {
  return (
    <Flex h="15vh" p="2rem" justifyContent="space-between" alignItems="center">
        <Text>Mini Job DApp</Text>
        <Flex 
            direction={["column", "column", "column", "row"]} 
            justifyContent="space-between" 
            alignItems="center" 
            width="25%"
        >
            <Link href="/">Home</Link>
            <Link href="/addajob">Add a Job</Link>
        </Flex>
        <ConnectButton />
    </Flex>
  )
};