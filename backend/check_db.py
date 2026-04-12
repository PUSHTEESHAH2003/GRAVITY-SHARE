import asyncio
import os
import sys
# Add backend to path to import database
sys.path.append(os.path.join(os.getcwd(), 'backend'))
from database import db

async def check():
    share = await db.shares.find_one({'code': '01259C'})
    print(share)

if __name__ == "__main__":
    asyncio.run(check())
