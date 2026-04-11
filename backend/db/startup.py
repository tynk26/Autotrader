import asyncio
from db.database import engine, Base


async def init_db():
    for i in range(10):
        try:
            async with engine.begin() as conn:
                await conn.run_sync(Base.metadata.create_all)

            print("[DB] connected + tables created")
            return

        except Exception as e:
            print(f"[DB] retry {i}: {e}")
            await asyncio.sleep(2)

    raise RuntimeError("DB init failed")