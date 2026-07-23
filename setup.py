from setuptools import setup

setup(
    name="flux-3-video-api",
    version="0.1.0",
    author="Anil Matcha",
    description="Python wrapper for Black Forest Labs' FLUX 3 video API — Text-to-Video and Image-to-Video with native synchronized audio.",
    long_description=open("README.md").read(),
    long_description_content_type="text/markdown",
    py_modules=["flux3_video_api", "mcp_server"],
    install_requires=[
        "requests",
        "python-dotenv",
        "mcp[cli]"
    ],
    classifiers=[
        "Programming Language :: Python :: 3",
        "License :: OSI Approved :: MIT License",
        "Operating System :: OS Independent",
    ],
    python_requires='>=3.7',
)
