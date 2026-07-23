import json
from mcp.server.fastmcp import FastMCP
from flux3_video_api import Flux3VideoAPI

# Initialize FastMCP server
mcp = FastMCP("FLUX 3 Video API Server")

# Helper to get API client
def get_api():
    return Flux3VideoAPI()

@mcp.tool()
def text_to_video(prompt: str, aspect_ratio: str = "16:9", resolution: str = "720p", duration: int = 5, generate_audio: bool = True) -> str:
    """
    Generate a video from a text prompt using FLUX 3.

    :param prompt: Descriptive text prompt for the video scene and motion.
    :param aspect_ratio: Video aspect ratio (e.g., '16:9', '9:16', '1:1').
    :param resolution: '480p', '720p', or '1080p'.
    :param duration: Duration in seconds (4-10).
    :param generate_audio: Whether to generate synchronized native audio.
    """
    api = get_api()
    result = api.text_to_video(prompt, aspect_ratio, resolution, duration, generate_audio)
    return json.dumps(result, indent=2)

@mcp.tool()
def image_to_video(prompt: str, images_list: list[str], aspect_ratio: str = "16:9", resolution: str = "720p", duration: int = 5, generate_audio: bool = True) -> str:
    """
    Animate a static image into a video using FLUX 3.

    :param prompt: Text prompt guiding the animation.
    :param images_list: List containing the start-frame image URL.
    :param aspect_ratio: Video aspect ratio.
    :param resolution: '480p', '720p', or '1080p'.
    :param duration: Duration in seconds (4-10).
    :param generate_audio: Whether to generate synchronized native audio.
    """
    api = get_api()
    result = api.image_to_video(prompt, images_list, aspect_ratio, resolution, duration, generate_audio)
    return json.dumps(result, indent=2)

@mcp.tool()
def upload_file(file_path: str) -> str:
    """
    Upload a local file (image or video) to MuAPI for use in generation tasks.

    :param file_path: Local path to the file.
    """
    api = get_api()
    result = api.upload_file(file_path)
    return json.dumps(result, indent=2)

@mcp.tool()
def get_task_status(request_id: str) -> str:
    """
    Check the status and get results of a generation task.

    :param request_id: The ID returned from a generation tool call.
    """
    api = get_api()
    result = api.get_result(request_id)
    return json.dumps(result, indent=2)

if __name__ == "__main__":
    mcp.run()
