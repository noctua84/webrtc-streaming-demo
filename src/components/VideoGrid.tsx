import React, { useRef, useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import { VideoOff, Users } from 'lucide-react';
import { useStores } from '@/hooks/useStores';

export const VideoGrid: React.FC = observer(() => {
    const { webrtc } = useStores();
    const localVideoRef = useRef<HTMLVideoElement>(null);
    const remoteVideoRefs = useRef<Map<string, HTMLVideoElement>>(new Map());

    // Update local video when stream changes
    useEffect(() => {
        if (localVideoRef.current && webrtc.localStream) {
            localVideoRef.current.srcObject = webrtc.localStream;
        }
    }, [webrtc.localStream]);

    // Update remote videos when streams change
    useEffect(() => {
        webrtc.remoteStreamArray.forEach(({ participantId, stream }) => {
            const videoElement = remoteVideoRefs.current.get(participantId);
            if (videoElement) {
                videoElement.srcObject = stream;
            }
        });
    }, [webrtc.remoteStreamArray]);

    const setRemoteVideoRef = (participantId: string) => (el: HTMLVideoElement | null) => {
        if (el) {
            remoteVideoRefs.current.set(participantId, el);
            const stream = webrtc.remoteStreams.get(participantId);
            if (stream) {
                el.srcObject = stream;
            }
        } else {
            remoteVideoRefs.current.delete(participantId);
        }
    };

    return (
        <div className="grid lg:grid-cols-2 gap-4">
            {/* Local Video */}
            <div className="relative bg-gray-800 rounded-lg overflow-hidden aspect-video">
                <video
                    ref={localVideoRef}
                    autoPlay
                    muted
                    playsInline
                    className="w-full h-full object-cover"
                />
                <div className="absolute bottom-2 left-2 bg-black/50 px-2 py-1 rounded text-sm">
                    You ({webrtc.role === 'host' ? 'Instructor' : 'Student'})
                </div>
                {!webrtc.isVideoEnabled && (
                    <div className="absolute inset-0 bg-gray-700 flex items-center justify-center">
                        <VideoOff className="w-12 h-12 text-gray-400" />
                    </div>
                )}
            </div>

            {/* Remote Videos */}
            {webrtc.remoteStreamArray.map(({ participantId }, index) => (
                <div key={participantId} className="relative bg-gray-800 rounded-lg overflow-hidden aspect-video">
                    <video
                        ref={setRemoteVideoRef(participantId)}
                        autoPlay
                        playsInline
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute bottom-2 left-2 bg-black/50 px-2 py-1 rounded text-sm">
                        {webrtc.role === 'host' ? 'Student' : 'Instructor'} {index + 1}
                    </div>
                </div>
            ))}

            {/* Placeholder when no remote participants */}
            {webrtc.remoteStreamArray.length === 0 && (
                <div className="relative bg-gray-800 rounded-lg overflow-hidden aspect-video">
                    <div className="absolute inset-0 bg-gray-700 flex items-center justify-center">
                        <div className="text-center">
                            <Users className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                            <p className="text-gray-400">
                                Waiting for {webrtc.role === 'host' ? 'students' : 'instructor'}...
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
});
