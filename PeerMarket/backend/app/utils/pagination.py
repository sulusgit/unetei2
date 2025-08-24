from math import ceil

def paginate(query, page: int, page_size: int):
    total = query.count()
    pages = ceil(total / page_size) if page_size else 1
    items = query.offset((page - 1) * page_size).limit(page_size).all()
    return items, {"total": total, "page": page, "page_size": page_size, "pages": pages}