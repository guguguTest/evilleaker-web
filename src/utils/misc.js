export function joinUrl(...parts) {
    return parts
        .filter(Boolean) // 去掉 undefined / null / 空字符串
        .map((part, index) => {
            // 去掉开头结尾多余斜杠
            part = part.replace(/(^\/+|\/+$)/g, '');
            // 第一个是 base，不能去掉开头的协议中的 //（例如 https://）
            if (index === 0)
                part = part.replace(/\/+$/, ''); // 只去结尾的 /
            return part;
        })
        .join('/');
}

export function filterObject(obj) {
    return Object.fromEntries(
        Object.entries(obj).filter(([_, value]) => value !== undefined && value !== null && value !== '')
    );
}
