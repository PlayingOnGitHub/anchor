import * as React from 'react'
import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  ForwardedRef,
} from 'react'
import {
  chakra,
  Center,
  Flex,
  Grid,
  HStack,
  IconButton,
  Spacer,
  AspectRatio,
} from '@chakra-ui/react'
import Hls from 'hls.js'
import {
  FaCompress,
  FaExpand,
  FaPause,
  FaPlay,
  FaVolumeDown,
  FaVolumeMute,
} from 'react-icons/fa'
import { update } from 'lodash'

const VideoEl = chakra('video')

function ControlButton(props: React.ComponentProps<typeof IconButton>) {
  return (
    <IconButton
      colorScheme="gray"
      background="gray.950"
      _hover={{ background: 'gray.700' }}
      _active={{ background: 'gray.900' }}
      variant="outline"
      {...props}
    />
  )
}

type VideoProps = React.ComponentProps<typeof VideoEl> & { onUnmute: () => {} }
const Video = forwardRef(
  (
    { src, onUnmute, ...props }: VideoProps,
    ref: ForwardedRef<HTMLVideoElement>,
  ) => {
    const containerRef = useRef<HTMLDivElement>()
    const videoRef = useRef<HTMLVideoElement>()
    const [isPlaying, setIsPlaying] = useState(false)
    const [isMuted, setIsMuted] = useState(false)
    const [isFullscreen, setIsFullscreen] = useState(false)

    function handlePlay() {
      videoRef.current?.play()
    }

    function handlePause() {
      videoRef.current?.pause()
    }

    function handleMute() {
      if (videoRef.current) {
        videoRef.current.muted = true
      }
    }

    function handleUnmute() {
      if (videoRef.current) {
        videoRef.current.muted = false
      }
      onUnmute?.()
    }

    function handleFullscreen() {
      containerRef.current?.requestFullscreen()
    }

    function handleExitFullscreen() {
      document.exitFullscreen()
    }

    useEffect(() => {
      const video = videoRef.current
      if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = src
        video.addEventListener('loadedmetadata', () => {
          video.play()
        })
      } else if (Hls.isSupported()) {
        var hls = new Hls()
        hls.loadSource(src)
        hls.attachMedia(video)
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          video.play()
        })
      }

      function play() {
        setIsPlaying(true)
        setIsMuted(video.muted)
      }

      function pause() {
        setIsPlaying(false)
      }

      function updateMuted() {
        setIsMuted(video.muted)
      }

      function updateFullscreen(ev) {
        setIsFullscreen(document.fullscreenElement === ev.currentTarget)
      }

      video.addEventListener('play', play)
      video.addEventListener('pause', pause)
      video.addEventListener('volumechange', updateMuted)
      containerRef.current.addEventListener(
        'fullscreenchange',
        updateFullscreen,
      )

      return () => {
        video.removeEventListener('play', play)
        video.removeEventListener('pause', pause)
        video.removeEventListener('volumechange', updateMuted)
        containerRef.current.removeEventListener(
          'fullscreenchange',
          updateFullscreen,
        )
      }
    }, [src])

    useImperativeHandle(ref, () => videoRef.current)

    return (
      <Flex width="full" maxHeight="full" pb={{ base: 0, lg: 14 }}>
        <AspectRatio width="full" ratio={16 / 9}>
          <Flex ref={containerRef}>
            <Grid
              position="absolute"
              left="0"
              top="0"
              right="0"
              bottom="0"
              m={2}
              templateColumns="repeat(3, 1fr)"
              alignItems="end"
              opacity={isPlaying ? 0 : 1}
              _hover={{ opacity: 1 }}
              transitionProperty="opacity"
              transitionDuration="normal"
              zIndex={100}
            >
              <Spacer />
              <Center>
                <ControlButton
                  onClick={isPlaying ? handlePause : handlePlay}
                  icon={isPlaying ? <FaPause /> : <FaPlay />}
                  size="lg"
                  fontSize="3xl"
                  boxSize={20}
                  aria-label={isPlaying ? 'Pause' : 'Play'}
                />
              </Center>
              <HStack justifyContent="flex-end">
                <ControlButton
                  onClick={isMuted ? handleUnmute : handleMute}
                  icon={isMuted ? <FaVolumeMute /> : <FaVolumeDown />}
                  colorScheme={isMuted ? 'deepRed' : 'gray'}
                  size="md"
                  aria-label={isMuted ? 'Unmute' : 'Mute'}
                />
                <ControlButton
                  onClick={
                    isFullscreen ? handleExitFullscreen : handleFullscreen
                  }
                  icon={isFullscreen ? <FaCompress /> : <FaExpand />}
                  size="md"
                  aria-label={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
                />
              </HStack>
            </Grid>
            <VideoEl
              key={src}
              ref={videoRef}
              opacity={isPlaying ? 1 : 0.5}
              transitionProperty="opacity"
              transitionDuration="fast"
              width="full"
              height="full"
              {...props}
            />
          </Flex>
        </AspectRatio>
      </Flex>
    )
  },
)

export default Video
