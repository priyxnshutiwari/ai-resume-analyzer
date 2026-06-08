import { Link, useNavigate, useParams } from "react-router";
import { useEffect, useState } from "react";
import { usePuterStore } from "~/lib/puter";

export const meta = () => ([
    { title: 'Resumind | Review' },
    { name: 'description', content: 'Detailed overview of your resume' },
]);

const Resume = () => {
    // Added isLoading to handle initial state if Puter takes time to initialize
    const { auth, isLoading, fs, kv } = usePuterStore();
    const { id } = useParams();
    const [imageUrl, setImageUrl] = useState('');
    const [resumeUrl, setResumeUrl] = useState('');
    const [feedback, setFeedback] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        if(!auth.isAuthenticated) navigate(`/auth?next=/resume/${id}`);
    },[auth.isAuthenticated])

    useEffect(() => {
        // Don't fetch if Puter services aren't ready or id is missing
        if (isLoading || !kv || !fs || !id) return;

        let active = true;
        let localResumeUrl = '';
        let localImageUrl = '';

        const loadResume = async () => {
            try {
                // Fixed template literal string interpolation
                const resume = await kv.get(`resume:${id}`);
                if (!resume || !active) return;

                const data = JSON.parse(resume);

                // Fetch and parse PDF Blob
                const resumeBlob = await fs.read(data.resumePath);
                if (!resumeBlob || !active) return;
                const pdfBlob = new Blob([resumeBlob], { type: "application/pdf" });
                localResumeUrl = URL.createObjectURL(pdfBlob);

                // Fetch and parse Image Blob
                const imageBlob = await fs.read(data.imagePath);
                if (!imageBlob || !active) {
                    // Cleanup the first URL if we fail halfway
                    if (localResumeUrl) URL.revokeObjectURL(localResumeUrl);
                    return;
                }
                localImageUrl = URL.createObjectURL(imageBlob);

                // Update state safely
                setResumeUrl(localResumeUrl);
                setImageUrl(localImageUrl);
                setFeedback(data.feedback);

            } catch (error) {
                console.error("Failed to load resume details:", error);
            }
        };

        loadResume();

        // Cleanup function to prevent memory leaks and race conditions
        return () => {
            active = false;
            if (localResumeUrl) URL.revokeObjectURL(localResumeUrl);
            if (localImageUrl) URL.revokeObjectURL(localImageUrl);
        };
    }, [id, kv, fs, isLoading]);

    if (isLoading) {
        return <div className="flex h-screen items-center justify-center">Loading resume details...</div>;
    }

    return (
        <main className="!pt-0">
            <nav className="resume-nav p-4">
                <Link to="/" className="back-button flex items-center gap-2">
                    <img src="/icons/back.svg" alt="logo" className="w-2.5 h-2.5" />
                    <span className="text-gray-800 text-sm font-semibold">Back to Homepage</span>
                </Link>
            </nav>

            <div className="flex flex-row w-full max-lg:flex-col-reverse">

                <section className="feedback-section bg-[url('/images/bg-small.svg')] bg-cover h-[100vh] sticky top-0 flex items-center justify-center w-full">
                    {imageUrl && resumeUrl ? (
                        <div className="animate-in fade-in duration-1000 gradient-border max-sm:m-0 h-[90%] max-w-xl:h-fit w-fit">
                            <a href={resumeUrl} target="_blank" rel="noopener noreferrer">
                                <img
                                    src={imageUrl}
                                    className="w-full h-full object-contain rounded-2xl"
                                    alt="resume preview"
                                    title="Click to view PDF"
                                />
                            </a>
                        </div>
                    ) : (
                        <p className="text-gray-500">No preview file found.</p>
                    )}
                </section>
                <section className="feedback-section">
                    <h2 className="text-4xl !text-black font-bold">Resume Review</h2>
                    {feedback ? (
                        <div className="flex flex-col gap-8 animate-in fade-in duration-1000">
                            Summary ATS Details
                        </div>
                    ) : (
                        <img src="/images/resume-scan-2.gif" className="w-full" />
                    )}
                </section>
            </div>
        </main>
    );
};

export default Resume;