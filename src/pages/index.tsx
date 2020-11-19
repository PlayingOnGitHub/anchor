import * as React from 'react'
import { useLayoutEffect, useState, useRef } from 'react'
import {
  Box,
  Button,
  Center,
  Drawer,
  DrawerBody,
  DrawerCloseButton,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerOverlay,
  Flex,
  Input,
  Text,
  VStack,
  useDisclosure,
} from '@chakra-ui/react'
import ReCAPTCHA from 'react-google-recaptcha'
import { Scrollbars } from 'react-custom-scrollbars'

import { siteName, recaptchaSiteKey } from '../constants'
import Video from '../Video'
import useAnchor from '../useAnchor'

const RECAPTCHA_WIDTH = '304px'

function AuthDrawer({ isOpen, onClose, finalFocusRef, onRegister, onLogin }) {
  const [mode, setMode] = useState<'login' | 'register'>('register')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [captchaToken, setCaptchaToken] = useState<string>()

  function handleToggleMode() {
    setMode(mode === 'register' ? 'login' : 'register')
  }

  function handleSubmit(ev: React.SyntheticEvent) {
    ev.preventDefault()
    if (mode === 'register') {
      onRegister(username, password, captchaToken)
    } else {
      onLogin(username, password)
    }
  }

  return (
    <Drawer
      placement="right"
      isOpen={isOpen}
      onClose={onClose}
      finalFocusRef={finalFocusRef}
    >
      <DrawerOverlay>
        <form onSubmit={handleSubmit}>
          <DrawerContent justifyContent="center" maxW="24rem">
            <Center flexDir="column">
              <DrawerHeader>
                {mode === 'register'
                  ? `Create a ${siteName} account`
                  : `Log in to ${siteName}`}
              </DrawerHeader>

              <DrawerBody>
                <VStack
                  spacing={4}
                  px={0}
                  w={RECAPTCHA_WIDTH}
                  alignItems="center"
                >
                  <Input
                    placeholder="Username"
                    value={username}
                    onChange={(ev) => setUsername(ev.target.value)}
                  />
                  <Input
                    placeholder="Password"
                    type="password"
                    value={password}
                    onChange={(ev) => setPassword(ev.target.value)}
                  />
                  {mode === 'register' && (
                    <ReCAPTCHA
                      sitekey={recaptchaSiteKey}
                      onChange={setCaptchaToken}
                    />
                  )}
                  <Flex alignItems="baseline" fontSize="md">
                    <Text>
                      {mode === 'register'
                        ? 'Have an account?'
                        : 'Need an account?'}
                    </Text>
                    <Button
                      onClick={handleToggleMode}
                      ml=".5em"
                      colorScheme="teal"
                      variant="link"
                    >
                      {mode === 'register' ? 'Login' : 'Register'}
                    </Button>
                    <Text>.</Text>
                  </Flex>
                </VStack>
              </DrawerBody>
              <DrawerFooter>
                <Button variant="outline" mr={3} onClick={onClose}>
                  Cancel
                </Button>
                <Button type="submit" colorScheme="teal">
                  {mode === 'register' ? 'Register' : 'Login'}
                </Button>
              </DrawerFooter>
              <DrawerCloseButton />
            </Center>
          </DrawerContent>
        </form>
      </DrawerOverlay>
    </Drawer>
  )
}

function Home() {
  // TODO: registration/login error handling
  const messagesRef = useRef<Scrollbars>()
  const authButtonRef = useRef<HTMLButtonElement>()
  const videoRef = useRef<HTMLVideoElement>()
  const { userInfo, timeline, actions } = useAnchor()
  const {
    isOpen: isAuthOpen,
    onOpen: onAuthOpen,
    onClose: onAuthClose,
  } = useDisclosure()
  const [messageText, setMessageText] = useState('')

  function handleUnmute() {
    videoRef.current.muted = false
  }

  async function handleRegister(username, password, captchaToken) {
    await actions.register(username, password, captchaToken)
    onAuthClose()
  }

  async function handleLogin(username, password) {
    await actions.login(username, password)
    onAuthClose()
  }

  async function handleSend(ev: React.SyntheticEvent) {
    ev.preventDefault()
    setMessageText('')
    if (!messageText.length) {
      return
    }
    await actions.sendMessage(messageText)
  }

  useLayoutEffect(() => {
    const el = messagesRef.current
    if (!el) {
      return
    }
    el.scrollToBottom()
  }, [timeline])

  return (
    <Box display="flex" backgroundColor="gray.900" width="100vw" height="100vh">
      <Center onClick={handleUnmute} flex="1" backgroundColor="black">
        <Video
          ref={videoRef}
          src="https://a.woke.net/live/playlist.m3u8"
          muted
        />
      </Center>
      <Flex flexDir="column" w="sm">
        <Scrollbars
          ref={messagesRef}
          renderThumbVertical={(props) => (
            <Box {...props} bgColor="gray.600" borderRadius="full" />
          )}
          autoHide
          universal
        >
          {timeline &&
            timeline.map((ev) => {
              if (ev.getType() !== 'm.room.message') {
                return
              }
              return (
                <Text
                  key={ev.event.event_id}
                  px={4}
                  _odd={{ backgroundColor: 'gray.800' }}
                >
                  {ev.sender.name}: {ev.event.content.body}
                </Text>
              )
            })}
        </Scrollbars>
        {!userInfo ? null : userInfo.isGuest ? (
          <Button
            ref={authButtonRef}
            colorScheme="teal"
            onClick={onAuthOpen}
            mx={4}
            mb={4}
          >
            Log in to chat
          </Button>
        ) : (
          <form onSubmit={handleSend} style={{ display: 'flex' }}>
            <Input
              m={2}
              px={2}
              flex={1}
              placeholder="Say something"
              value={messageText}
              onChange={(ev) => setMessageText(ev.target.value)}
            />
          </form>
        )}
      </Flex>
      <AuthDrawer
        isOpen={isAuthOpen}
        onClose={onAuthClose}
        finalFocusRef={authButtonRef}
        onRegister={handleRegister}
        onLogin={handleLogin}
      />
    </Box>
  )
}

export default Home
